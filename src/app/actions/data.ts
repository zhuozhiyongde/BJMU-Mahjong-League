'use server';

import { db, schema } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { updateMemberStats } from './members';
import { getGameRecords } from './games';
import { processTiedScores, TOTAL_GAME_SCORE, TOTAL_GAME_SCORE_TOLERANCE, type PlayerScore } from '@/lib/scoring';

interface LegacyRecord {
    id?: number;
    members: unknown[];
    scores: unknown[];
    timestamp?: unknown;
    sortedMembers?: unknown[];
    sortedScores?: unknown[];
    ranks?: number[];
    actualRanks?: number[];
    displayRanks?: number[];
    tiedGroups?: number[][];
    rankBonuses?: number[];
}

interface LegacyData {
    members?: unknown[]; // 忽略，从对局记录重新计算
    inputRecords: LegacyRecord[];
    exportTime?: string;
    exportTimeLocal?: string;
    version?: string;
}

function parseLegacyPlayers(record: LegacyRecord): { ok: true; players: PlayerScore[] } | { ok: false; error: string } {
    const members = Array.isArray(record.members) ? record.members : null;
    const scores = Array.isArray(record.scores) ? record.scores : null;

    if (!members || !scores) {
        return { ok: false, error: '缺少 members/scores 字段' };
    }
    if (members.length !== 4 || scores.length !== 4) {
        return { ok: false, error: 'members/scores 必须都是长度为 4 的数组' };
    }

    const players: PlayerScore[] = [];
    for (let i = 0; i < 4; i++) {
        const rawName = members[i];
        const memberName = (typeof rawName === 'string' ? rawName : String(rawName ?? '')).trim();
        if (!memberName) {
            return { ok: false, error: `第 ${i + 1} 位选手名称为空` };
        }

        const rawScore = scores[i] as unknown;
        const score =
            typeof rawScore === 'number' ? rawScore : typeof rawScore === 'string' ? Number(rawScore) : Number.NaN;

        if (!Number.isFinite(score)) {
            return { ok: false, error: `第 ${i + 1} 位分数不是有效数字` };
        }

        players.push({ memberName, score });
    }

    const uniqueNames = new Set(players.map((p) => p.memberName));
    if (uniqueNames.size !== 4) {
        return { ok: false, error: '存在重复选手' };
    }

    const totalScore = players.reduce((sum, p) => sum + p.score, 0);
    if (Math.abs(totalScore - TOTAL_GAME_SCORE) > TOTAL_GAME_SCORE_TOLERANCE) {
        return { ok: false, error: `四个分数之和必须等于${TOTAL_GAME_SCORE}（当前为 ${totalScore}）` };
    }

    return { ok: true, players };
}

// 检查是否允许导入数据
export async function checkImportEnabled() {
    // 通过环境变量控制，生产环境设置 DISABLE_IMPORT=true 禁用导入
    const disabled = process.env.DISABLE_IMPORT === 'true';
    return !disabled;
}

export async function importLegacyData(jsonData: string) {
    // 检查是否允许导入
    const importEnabled = await checkImportEnabled();
    if (!importEnabled) {
        return { success: false, error: '导入功能已禁用（生产环境）' };
    }

    try {
        const data: LegacyData = JSON.parse(jsonData);

        if (!data.inputRecords) {
            return { success: false, error: '数据格式不正确，缺少 inputRecords 字段' };
        }

        if (!Array.isArray(data.inputRecords)) {
            return { success: false, error: '数据格式不正确，inputRecords 必须是数组' };
        }

        const validGames: { timestamp: string; players: PlayerScore[] }[] = [];
        const skippedRecords: { index: number; error: string; raw: LegacyRecord }[] = [];

        for (let i = 0; i < data.inputRecords.length; i++) {
            const record = data.inputRecords[i];
            const parsed = parseLegacyPlayers(record);
            if (!parsed.ok) {
                skippedRecords.push({ index: i, error: parsed.error, raw: record });
                continue;
            }

            const timestamp =
                typeof record.timestamp === 'string' && record.timestamp.trim()
                    ? record.timestamp
                    : new Date().toLocaleString('zh-CN');
            validGames.push({ timestamp, players: parsed.players });
        }

        if (validGames.length === 0) {
            return { success: false, error: '导入数据中没有有效的对局记录（已全部跳过）' };
        }

        // Clear existing data
        await db.delete(schema.gameResults);
        await db.delete(schema.gameRecords);
        await db.delete(schema.members);

        // 从对局记录中提取所有选手名单
        const memberNames = new Set<string>();
        for (const game of validGames) {
            for (const player of game.players) {
                memberNames.add(player.memberName);
            }
        }

        // 创建选手（只创建空记录，统计数据稍后从对局记录计算）
        const memberMap = new Map<string, number>();
        for (const name of memberNames) {
            const [member] = await db
                .insert(schema.members)
                .values({
                    name,
                    points: 0,
                    basePoints: 0,
                    games: 0,
                    first: 0,
                    second: 0,
                    third: 0,
                    fourth: 0,
                    highestScore: null,
                    catCount: 0,
                    negativeCount: 0,
                    createdAt: new Date().toISOString(),
                })
                .returning();

            memberMap.set(name, member.id);
        }

        // Import game records
        for (const game of validGames) {
            const [gameRecord] = await db
                .insert(schema.gameRecords)
                .values({
                    timestamp: game.timestamp,
                })
                .returning();

            // 基于导入的原始分数重新计算顺位/顺位马（忽略导入数据中的计算结果）
            const { sortedPlayers, ranks, rankBonuses } = processTiedScores(game.players);

            // Insert results
            for (let i = 0; i < 4; i++) {
                const memberName = sortedPlayers[i].memberName;
                const memberId = memberMap.get(memberName);

                await db.insert(schema.gameResults).values({
                    gameId: gameRecord.id,
                    memberId: memberId || null,
                    memberName,
                    score: sortedPlayers[i].score,
                    rank: ranks[i],
                    rankBonus: rankBonuses[i],
                });
            }
        }

        // 重新计算所有选手的统计数据
        for (const memberId of memberMap.values()) {
            await updateMemberStats(memberId);
        }

        revalidatePath('/');
        const totalCount = data.inputRecords.length;
        const importedCount = validGames.length;
        const skippedCount = skippedRecords.length;
        const skippedText = skippedCount > 0 ? `，已跳过 ${skippedCount} 条无效记录` : '';
        return {
            success: true,
            message: `成功导入 ${importedCount}/${totalCount} 条对局记录，共 ${memberNames.size} 位选手${skippedText}`,
            skippedRecords: skippedRecords.length > 0 ? skippedRecords : undefined,
        };
    } catch (error) {
        console.error('Import error:', error);
        return { success: false, error: '数据格式错误，请检查导入的数据是否为有效的JSON格式' };
    }
}

export async function exportData() {
    const gameRecords = await getGameRecords();

    const recordsOnly = gameRecords.map((record) => {
        const sortedResults = [...record.results].sort((a, b) => b.score - a.score);

        return {
            members: sortedResults.map((r) => r.memberName),
            scores: sortedResults.map((r) => r.score),
            timestamp: record.timestamp,
        };
    });

    return JSON.stringify({ inputRecords: recordsOnly }, null, 2);
}
