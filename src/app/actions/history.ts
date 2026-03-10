'use server';

import fs from 'fs';
import path from 'path';
import { processTiedScores, TOTAL_GAME_SCORE, TOTAL_GAME_SCORE_TOLERANCE, type PlayerScore } from '@/lib/scoring';

const historyDir = path.join(process.cwd(), 'data', 'history');

// Ensure history directory exists
function ensureHistoryDir() {
    if (!fs.existsSync(historyDir)) {
        fs.mkdirSync(historyDir, { recursive: true });
    }
}

interface HistoryRecord {
    members: unknown[];
    scores: unknown[];
    timestamp?: unknown;
}

interface HistorySeasonFile {
    name: string;
    createdAt: string;
    inputRecords: HistoryRecord[];
}

export interface HistorySeasonSummary {
    id: string;
    name: string;
    createdAt: string;
    hanchans: number;
}

export interface HistoryMember {
    name: string;
    points: number;
    basePoints: number;
    games: number;
    first: number;
    second: number;
    third: number;
    fourth: number;
    highestScore: number | null;
    catCount: number;
    negativeCount: number;
}

export interface HistoryGameRecord {
    index: number;
    timestamp: string;
    results: {
        memberName: string;
        score: number;
        rank: number;
        rankBonus: number;
    }[];
}

export interface HistorySeasonDetail {
    id: string;
    name: string;
    createdAt: string;
    hanchans: number;
    members: HistoryMember[];
    gameRecords: HistoryGameRecord[];
}

function parseHistoryPlayers(record: HistoryRecord): { ok: true; players: PlayerScore[] } | { ok: false; error: string } {
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

export async function getHistorySeasons(): Promise<HistorySeasonSummary[]> {
    ensureHistoryDir();

    const files = fs.readdirSync(historyDir).filter((f) => f.endsWith('.json'));
    const seasons: HistorySeasonSummary[] = [];

    for (const file of files) {
        try {
            const content = fs.readFileSync(path.join(historyDir, file), 'utf-8');
            const data: HistorySeasonFile = JSON.parse(content);
            const id = file.replace('.json', '');
            seasons.push({
                id,
                name: data.name,
                createdAt: data.createdAt,
                hanchans: data.inputRecords.length,
            });
        } catch {
            // Skip invalid files
        }
    }

    // Sort by createdAt descending
    seasons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return seasons;
}

export async function getHistorySeason(id: string): Promise<HistorySeasonDetail | null> {
    ensureHistoryDir();

    // Sanitize id to prevent path traversal
    const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(historyDir, `${sanitizedId}.json`);

    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data: HistorySeasonFile = JSON.parse(content);

        // Compute member stats and game records from inputRecords
        const memberStatsMap = new Map<string, HistoryMember>();
        const gameRecords: HistoryGameRecord[] = [];

        for (let i = 0; i < data.inputRecords.length; i++) {
            const record = data.inputRecords[i];
            const parsed = parseHistoryPlayers(record);
            if (!parsed.ok) continue;

            const timestamp =
                typeof record.timestamp === 'string' && record.timestamp.trim()
                    ? record.timestamp
                    : `对局 ${i + 1}`;

            const { sortedPlayers, ranks, rankBonuses } = processTiedScores(parsed.players);

            const results = sortedPlayers.map((player, j) => ({
                memberName: player.memberName,
                score: player.score,
                rank: ranks[j],
                rankBonus: rankBonuses[j],
            }));

            gameRecords.push({ index: i + 1, timestamp, results });

            // Update member stats
            for (let j = 0; j < 4; j++) {
                const name = sortedPlayers[j].memberName;
                const score = sortedPlayers[j].score;
                const rank = ranks[j];
                const rankBonus = rankBonuses[j];
                const originalPoints = score * 100;
                const basePoint = Math.round((originalPoints - 25000) / 100) / 10;
                const pointsDelta = basePoint + rankBonus - 5;

                let member = memberStatsMap.get(name);
                if (!member) {
                    member = {
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
                    };
                    memberStatsMap.set(name, member);
                }

                member.games++;
                member.points += pointsDelta;
                member.basePoints += basePoint;

                if (rank === 1) member.first++;
                else if (rank === 2) member.second++;
                else if (rank === 3) member.third++;
                else if (rank === 4) member.fourth++;

                if (member.highestScore === null || originalPoints > member.highestScore) {
                    member.highestScore = originalPoints;
                }

                if (score >= 500) {
                    member.catCount++;
                }

                if (score < 0) {
                    member.negativeCount++;
                }
            }
        }

        const members = Array.from(memberStatsMap.values())
            .map((m) => ({
                ...m,
                points: Math.round(m.points * 10) / 10,
                basePoints: Math.round(m.basePoints * 10) / 10,
            }))
            .sort((a, b) => b.points - a.points);

        return {
            id: sanitizedId,
            name: data.name,
            createdAt: data.createdAt,
            hanchans: gameRecords.length,
            members,
            gameRecords,
        };
    } catch {
        return null;
    }
}

export async function importHistorySeason(name: string, jsonData: string) {
    ensureHistoryDir();

    if (!name.trim()) {
        return { success: false, error: '请输入赛季名称' };
    }

    try {
        const data = JSON.parse(jsonData);

        if (!data.inputRecords || !Array.isArray(data.inputRecords)) {
            return { success: false, error: '数据格式不正确，缺少 inputRecords 数组' };
        }

        // Validate records
        let validCount = 0;
        let skippedCount = 0;
        const validRecords: HistoryRecord[] = [];

        for (let i = 0; i < data.inputRecords.length; i++) {
            const record = data.inputRecords[i];
            const parsed = parseHistoryPlayers(record);
            if (parsed.ok) {
                validCount++;
                validRecords.push(record);
            } else {
                skippedCount++;
            }
        }

        if (validCount === 0) {
            return { success: false, error: '导入数据中没有有效的对局记录' };
        }

        // Generate unique id
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const seasonFile: HistorySeasonFile = {
            name: name.trim(),
            createdAt: new Date().toISOString(),
            inputRecords: validRecords,
        };

        fs.writeFileSync(path.join(historyDir, `${id}.json`), JSON.stringify(seasonFile, null, 2));

        const skippedText = skippedCount > 0 ? `，已跳过 ${skippedCount} 条无效记录` : '';
        return {
            success: true,
            message: `成功导入「${name.trim()}」，共 ${validCount} 个半庄${skippedText}`,
        };
    } catch {
        return { success: false, error: '数据格式错误，请检查是否为有效的 JSON 格式' };
    }
}

export async function deleteHistorySeason(id: string) {
    ensureHistoryDir();

    const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(historyDir, `${sanitizedId}.json`);

    if (!fs.existsSync(filePath)) {
        return { success: false, error: '未找到该历史赛季' };
    }

    try {
        fs.unlinkSync(filePath);
        return { success: true, message: '已删除历史赛季' };
    } catch {
        return { success: false, error: '删除失败' };
    }
}
