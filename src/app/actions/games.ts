'use server';

import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getMemberByName, updateMemberStats } from './members';
import { processTiedScores, TOTAL_GAME_SCORE, TOTAL_GAME_SCORE_TOLERANCE, type PlayerScore } from '@/lib/scoring';

async function getOrCreateMemberId(memberName: string): Promise<number> {
    const trimmedName = memberName.trim();
    const existing = await getMemberByName(trimmedName);
    if (existing) return existing.id;

    try {
        const [created] = await db
            .insert(schema.members)
            .values({
                name: trimmedName,
                createdAt: new Date().toISOString(),
            })
            .returning();
        return created.id;
    } catch {
        const after = await getMemberByName(trimmedName);
        if (after) return after.id;
        throw new Error(`创建选手失败: ${trimmedName}`);
    }
}

export async function submitGame(players: PlayerScore[]) {
    // Validate
    if (players.length !== 4) {
        return { success: false, error: '必须选择4位选手' };
    }

    if (players.some((p) => !Number.isFinite(p.score))) {
        return { success: false, error: '请输入有效的分数' };
    }

    const normalizedPlayers: PlayerScore[] = players.map((p) => ({
        memberName: p.memberName.trim(),
        score: p.score,
    }));

    const names = normalizedPlayers.map((p) => p.memberName);
    if (names.some((n) => !n)) {
        return { success: false, error: '选手姓名不能为空' };
    }

    const uniqueNames = new Set(names);
    if (uniqueNames.size !== 4) {
        return { success: false, error: '不能选择重复的选手' };
    }

    const totalScore = normalizedPlayers.reduce((sum, p) => sum + p.score, 0);
    if (Math.abs(totalScore - TOTAL_GAME_SCORE) > TOTAL_GAME_SCORE_TOLERANCE) {
        return {
            success: false,
            error: `四个分数之和必须等于${TOTAL_GAME_SCORE}，当前总和为 ${totalScore}`,
        };
    }

    // Process tied scores
    const { sortedPlayers, ranks, rankBonuses } = processTiedScores(normalizedPlayers);

    // Create game record
    const timestamp = new Date().toLocaleString('zh-CN');
    const [gameRecord] = await db.insert(schema.gameRecords).values({ timestamp }).returning();

    // Create game results
    for (let i = 0; i < 4; i++) {
        const memberId = await getOrCreateMemberId(sortedPlayers[i].memberName);

        await db.insert(schema.gameResults).values({
            gameId: gameRecord.id,
            memberId,
            memberName: sortedPlayers[i].memberName,
            score: sortedPlayers[i].score,
            rank: ranks[i],
            rankBonus: rankBonuses[i],
        });

        // Update member stats
        await updateMemberStats(memberId);
    }

    revalidatePath('/');
    return { success: true };
}

export async function getGameRecords() {
    const records = await db.select().from(schema.gameRecords).orderBy(desc(schema.gameRecords.id));

    const recordsWithResults = await Promise.all(
        records.map(async (record) => {
            const results = await db
                .select()
                .from(schema.gameResults)
                .where(eq(schema.gameResults.gameId, record.id))
                .orderBy(schema.gameResults.rank);

            return {
                ...record,
                results,
            };
        })
    );

    return recordsWithResults;
}

export async function deleteGameRecord(gameId: number) {
    // Get all results for this game
    const results = await db.select().from(schema.gameResults).where(eq(schema.gameResults.gameId, gameId));

    // Delete the game record (cascade will delete results)
    await db.delete(schema.gameRecords).where(eq(schema.gameRecords.id, gameId));

    // Recalculate stats for affected members
    const memberIds = new Set(results.map((r) => r.memberId).filter(Boolean));
    for (const memberId of memberIds) {
        if (memberId) {
            await updateMemberStats(memberId);
        }
    }

    revalidatePath('/');
    return { success: true };
}

export async function getSeasonStats() {
    const members = await db.select().from(schema.members);
    const totalGames = members.reduce((sum, m) => sum + m.games, 0);
    const hanchans = totalGames / 4;

    return {
        hanchans,
        memberCount: members.length,
    };
}

// 获取单个对局记录
export async function getGameRecord(gameId: number) {
    const [record] = await db.select().from(schema.gameRecords).where(eq(schema.gameRecords.id, gameId));

    if (!record) return null;

    const results = await db
        .select()
        .from(schema.gameResults)
        .where(eq(schema.gameResults.gameId, gameId))
        .orderBy(schema.gameResults.rank);

    return {
        ...record,
        results,
    };
}

// 更新对局记录
export async function updateGameRecord(gameId: number, players: PlayerScore[]) {
    // Validate
    if (players.length !== 4) {
        return { success: false, error: '必须有4位选手' };
    }

    if (players.some((p) => !Number.isFinite(p.score))) {
        return { success: false, error: '请输入有效的分数' };
    }

    const normalizedPlayers: PlayerScore[] = players.map((p) => ({
        memberName: p.memberName.trim(),
        score: p.score,
    }));

    const names = normalizedPlayers.map((p) => p.memberName);
    if (names.some((n) => !n)) {
        return { success: false, error: '选手姓名不能为空' };
    }

    const uniqueNames = new Set(names);
    if (uniqueNames.size !== 4) {
        return { success: false, error: '不能有重复的选手' };
    }

    const totalScore = normalizedPlayers.reduce((sum, p) => sum + p.score, 0);
    if (Math.abs(totalScore - TOTAL_GAME_SCORE) > TOTAL_GAME_SCORE_TOLERANCE) {
        return {
            success: false,
            error: `四个分数之和必须等于${TOTAL_GAME_SCORE}，当前总和为 ${totalScore}`,
        };
    }

    // Get old results to update member stats later
    const oldResults = await db.select().from(schema.gameResults).where(eq(schema.gameResults.gameId, gameId));

    const oldMemberIds = new Set(oldResults.map((r) => r.memberId).filter(Boolean));

    // Delete old results
    await db.delete(schema.gameResults).where(eq(schema.gameResults.gameId, gameId));

    // Process tied scores
    const { sortedPlayers, ranks, rankBonuses } = processTiedScores(normalizedPlayers);

    // Create new game results
    const newMemberIds = new Set<number>();
    for (let i = 0; i < 4; i++) {
        const memberId = await getOrCreateMemberId(sortedPlayers[i].memberName);

        await db.insert(schema.gameResults).values({
            gameId: gameId,
            memberId,
            memberName: sortedPlayers[i].memberName,
            score: sortedPlayers[i].score,
            rank: ranks[i],
            rankBonus: rankBonuses[i],
        });

        newMemberIds.add(memberId);
    }

    // Update stats for all affected members (both old and new)
    const allMemberIds = new Set([...oldMemberIds, ...newMemberIds]);
    for (const memberId of allMemberIds) {
        if (memberId) {
            await updateMemberStats(memberId);
        }
    }

    revalidatePath('/');
    return { success: true };
}

export async function clearAllGameHistory() {
    // Align with import: production can disable destructive operations.
    const disabled = process.env.PRODUCTION === 'true';
    if (disabled) {
        return { success: false, error: '清空功能已禁用（生产环境）' };
    }

    // Delete everything (games + members)
    await db.delete(schema.gameResults);
    await db.delete(schema.gameRecords);
    await db.delete(schema.members);

    revalidatePath('/');
    return { success: true, message: '已清空所有对战历史与选手数据' };
}
