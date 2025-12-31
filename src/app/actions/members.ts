'use server';

import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getMembers() {
    const members = await db.select().from(schema.members).orderBy(desc(schema.members.points));
    return members;
}

export async function getMemberByName(name: string) {
    const [member] = await db.select().from(schema.members).where(eq(schema.members.name, name)).limit(1);
    return member;
}

export async function addMember(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
        return { success: false, error: '选手姓名不能为空' };
    }

    const existing = await getMemberByName(trimmedName);
    if (existing) {
        return { success: false, error: '该选手已存在' };
    }

    await db.insert(schema.members).values({
        name: trimmedName,
        createdAt: new Date().toISOString(),
    });

    revalidatePath('/');
    return { success: true };
}

export async function renameMember(oldName: string, newName: string) {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
        return { success: false, error: '新姓名不能为空' };
    }

    if (oldName === trimmedNewName) {
        return { success: false, error: '新姓名与当前姓名相同' };
    }

    const existing = await getMemberByName(trimmedNewName);
    if (existing) {
        return { success: false, error: `选手 "${trimmedNewName}" 已存在` };
    }

    // Update member name
    await db.update(schema.members).set({ name: trimmedNewName }).where(eq(schema.members.name, oldName));

    // Update game results
    await db
        .update(schema.gameResults)
        .set({ memberName: trimmedNewName })
        .where(eq(schema.gameResults.memberName, oldName));

    revalidatePath('/');
    return { success: true };
}

export async function deleteMember(name: string) {
    const disabled = process.env.PRODUCTION === 'true';
    if (disabled) {
        return { success: false, error: '删除功能已禁用（生产环境）' };
    }

    const member = await getMemberByName(name);
    if (!member) {
        return { success: false, error: '选手不存在' };
    }

    // Find all game records that include this member
    const memberResults = await db
        .select({ gameId: schema.gameResults.gameId })
        .from(schema.gameResults)
        .where(eq(schema.gameResults.memberName, name));

    const gameIds = [...new Set(memberResults.map((r) => r.gameId))];

    // Delete the game records (cascade will delete results)
    for (const gameId of gameIds) {
        await db.delete(schema.gameRecords).where(eq(schema.gameRecords.id, gameId));
    }

    // Delete the member
    await db.delete(schema.members).where(eq(schema.members.name, name));

    revalidatePath('/');
    return { success: true };
}

export async function updateMemberStats(memberId: number) {
    // Recalculate all stats from game results
    const results = await db.select().from(schema.gameResults).where(eq(schema.gameResults.memberId, memberId));

    if (results.length === 0) {
        // Reset stats if no games
        await db
            .update(schema.members)
            .set({
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
            })
            .where(eq(schema.members.id, memberId));
        return;
    }

    let points = 0;
    let basePoints = 0;
    let first = 0;
    let second = 0;
    let third = 0;
    let fourth = 0;
    let highestScore: number | null = null;
    let catCount = 0;
    let negativeCount = 0;

    const startPoints = 25000;
    const returnPoints = 30000;
    const returnPenalty = (returnPoints - startPoints) / 1000; // 5.0p

    for (const result of results) {
        const score = result.score;
        // 素点 = (原始点数 - 25000) / 1000
        // score 存储的是 原始点数/100，所以先还原为原始点数再计算
        const originalPoints = score * 100;
        const basePoint = Math.round((originalPoints - startPoints) / 100) / 10; // 舍入到小数点后一位
        // 积分 = (原始点数 - 30000)/1000 + 顺位点（50/10/-10/-30）
        //      = 素点 + 顺位点 - 5
        const pointsDelta = basePoint + result.rankBonus - returnPenalty;

        points += pointsDelta;
        basePoints += basePoint;

        switch (result.rank) {
            case 1:
                first++;
                break;
            case 2:
                second++;
                break;
            case 3:
                third++;
                break;
            case 4:
                fourth++;
                break;
        }

        if (highestScore === null || originalPoints > highestScore) {
            highestScore = originalPoints;
        }

        if (score >= 500) {
            catCount++;
        }
        if (score < 0) {
            negativeCount++;
        }
    }

    // 舍入到小数点后一位
    points = Math.round(points * 10) / 10;
    basePoints = Math.round(basePoints * 10) / 10;

    await db
        .update(schema.members)
        .set({
            points,
            basePoints,
            games: first + second + third + fourth,
            first,
            second,
            third,
            fourth,
            highestScore,
            catCount,
            negativeCount,
        })
        .where(eq(schema.members.id, memberId));
}

// 合并选手：将 sourceName 的所有数据合并到 targetName
export async function mergeMembers(targetName: string, sourceName: string) {
    // Production: disable merge to prevent destructive changes.
    const disabled = process.env.PRODUCTION === 'true';
    if (disabled) {
        return { success: false, error: '合并功能已禁用（生产环境）' };
    }

    if (targetName === sourceName) {
        return { success: false, error: '不能将选手合并到自己' };
    }

    const targetMember = await getMemberByName(targetName);
    const sourceMember = await getMemberByName(sourceName);

    if (!targetMember) {
        return { success: false, error: `目标选手 "${targetName}" 不存在` };
    }

    if (!sourceMember) {
        return { success: false, error: `源选手 "${sourceName}" 不存在` };
    }

    // 将源选手的所有对局记录转移到目标选手
    await db
        .update(schema.gameResults)
        .set({
            memberId: targetMember.id,
            memberName: targetMember.name,
        })
        .where(eq(schema.gameResults.memberId, sourceMember.id));

    // 也更新按名字关联的记录（以防有些记录没有正确关联 memberId）
    await db
        .update(schema.gameResults)
        .set({
            memberId: targetMember.id,
            memberName: targetMember.name,
        })
        .where(eq(schema.gameResults.memberName, sourceName));

    // 删除源选手
    await db.delete(schema.members).where(eq(schema.members.id, sourceMember.id));

    // 重新计算目标选手的统计数据
    await updateMemberStats(targetMember.id);

    revalidatePath('/');
    return { success: true, message: `已将 "${sourceName}" 的数据合并到 "${targetName}"` };
}
