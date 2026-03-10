'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { getHistorySeason, type HistorySeasonDetail, type HistoryMember } from '@/app/actions/history';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function formatPoints(points: number): string {
    return points.toFixed(1);
}

function calculateAvgRank(member: HistoryMember): string {
    if (member.games === 0) return '0';
    const avgRank = (member.first * 1 + member.second * 2 + member.third * 3 + member.fourth * 4) / member.games;
    return avgRank.toFixed(2);
}

function calculateFirstRate(member: HistoryMember): string {
    if (member.games === 0) return '0%';
    return ((member.first / member.games) * 100).toFixed(1) + '%';
}

function calculateFourthAvoidRate(member: HistoryMember): string {
    if (member.games === 0) return '100%';
    return ((1 - member.fourth / member.games) * 100).toFixed(1) + '%';
}

function getRankColor(rank: number): string {
    switch (rank) {
        case 1:
            return 'text-green-600 dark:text-green-400';
        case 2:
            return 'text-blue-600 dark:text-blue-400';
        case 3:
            return 'text-yellow-600 dark:text-yellow-400';
        case 4:
            return 'text-red-600 dark:text-red-400';
        default:
            return '';
    }
}

export default function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [season, setSeason] = useState<HistorySeasonDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRecords, setShowRecords] = useState(false);

    const loadSeason = useCallback(async () => {
        try {
            const data = await getHistorySeason(id);
            setSeason(data);
        } catch {
            toast.error('加载赛季数据失败');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadSeason();
    }, [loadSeason]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg text-muted-foreground">加载中...</div>
            </div>
        );
    }

    if (!season) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-lg text-muted-foreground">未找到该赛季数据</p>
                <Link href="/history">
                    <Button variant="outline">返回历史赛季</Button>
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="max-w-[1400px] mx-auto p-4 md:p-6">
                <header className="border-b pb-4 mb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h1 className="text-2xl font-bold text-foreground max-sm:m-auto">{season.name}</h1>
                        <div className="flex flex-wrap items-center gap-2 max-sm:mx-auto">
                            <Link href="/history">
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    返回列表
                                </Button>
                            </Link>
                            <Button
                                variant={showRecords ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setShowRecords(!showRecords)}>
                                {showRecords ? '查看成绩表' : '查看对局记录'}
                            </Button>
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                <div className="text-center mb-4 p-3 bg-primary/5 rounded-lg">
                    <p className="text-lg font-medium text-foreground max-sm:text-sm">
                        该赛季共进行了 {season.hanchans} 个半庄
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        导入时间：{new Date(season.createdAt).toLocaleString('zh-CN')}
                    </p>
                </div>

                {!showRecords ? (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>{season.name} 成绩表</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="sticky left-0 z-20 bg-background text-center w-12 min-w-12 max-w-12">排名</TableHead>
                                            <TableHead className="sticky left-12 z-20 bg-background text-center shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">选手</TableHead>
                                            <TableHead className="text-center">积分</TableHead>
                                            <TableHead className="text-center">素点</TableHead>
                                            <TableHead className="text-center">场数</TableHead>
                                            <TableHead className="text-center bg-green-500/10">一位</TableHead>
                                            <TableHead className="text-center bg-blue-500/10">二位</TableHead>
                                            <TableHead className="text-center bg-yellow-500/10">三位</TableHead>
                                            <TableHead className="text-center bg-red-500/10">四位</TableHead>
                                            <TableHead className="text-center">平均顺位</TableHead>
                                            <TableHead className="text-center">吃一率</TableHead>
                                            <TableHead className="text-center">避四率</TableHead>
                                            <TableHead className="text-center">半庄最高分</TableHead>
                                            <TableHead className="text-center">猫猫头次数</TableHead>
                                            <TableHead className="text-center">被飞次数</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {season.members.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                                                    暂无选手数据
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            season.members.map((member, index) => (
                                                <TableRow key={member.name}>
                                                    <TableCell className="sticky left-0 z-10 bg-background text-center font-medium w-12 min-w-12 max-w-12">{index + 1}</TableCell>
                                                    <TableCell className="sticky left-12 z-10 bg-background text-center font-semibold shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">{member.name}</TableCell>
                                                    <TableCell
                                                        className={cn(
                                                            'text-center font-medium',
                                                            member.points >= 0
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : 'text-red-600 dark:text-red-400',
                                                        )}>
                                                        {formatPoints(member.points)}
                                                    </TableCell>
                                                    <TableCell
                                                        className={cn(
                                                            'text-center',
                                                            member.basePoints >= 0
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : 'text-red-600 dark:text-red-400',
                                                        )}>
                                                        {formatPoints(member.basePoints)}
                                                    </TableCell>
                                                    <TableCell className="text-center">{member.games}</TableCell>
                                                    <TableCell className="text-center bg-green-500/10">{member.first}</TableCell>
                                                    <TableCell className="text-center bg-blue-500/10">{member.second}</TableCell>
                                                    <TableCell className="text-center bg-yellow-500/10">{member.third}</TableCell>
                                                    <TableCell className="text-center bg-red-500/10">{member.fourth}</TableCell>
                                                    <TableCell className="text-center">{calculateAvgRank(member)}</TableCell>
                                                    <TableCell className="text-center">{calculateFirstRate(member)}</TableCell>
                                                    <TableCell className="text-center">{calculateFourthAvoidRate(member)}</TableCell>
                                                    <TableCell className="text-center text-purple-600 dark:text-purple-400">
                                                        {member.highestScore ?? 0}
                                                    </TableCell>
                                                    <TableCell className="text-center text-orange-600 dark:text-orange-400">
                                                        {member.catCount}
                                                    </TableCell>
                                                    <TableCell className="text-center text-red-600 dark:text-red-400">
                                                        {member.negativeCount}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>{season.name} 对局记录</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {season.gameRecords.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">暂无对局记录</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    {season.gameRecords.map((record) => {
                                        const scores = record.results.map((r) => r.score);
                                        const hasTied = new Set(scores).size !== scores.length;

                                        return (
                                            <div key={record.index} className="bg-muted/50 rounded-lg p-4">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium">
                                                            第 {record.index} 半庄 ({record.timestamp})
                                                        </h4>
                                                        {hasTied && (
                                                            <Badge variant="outline" className="text-orange-600">
                                                                含同分
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {record.results
                                                        .sort((a, b) => a.rank - b.rank)
                                                        .map((result, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex justify-between items-center py-1 border-b border-dashed border-border last:border-0">
                                                                <span className="font-medium">
                                                                    {result.rank}. {result.memberName}
                                                                </span>
                                                                <span className={cn('font-mono', getRankColor(result.rank))}>
                                                                    {result.score * 100}
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <footer className="mt-8 text-center text-sm text-muted-foreground py-4 border-t">
                    <p>
                        BJMU League 历史赛季 &copy; 2025{' '}
                        <a
                            href="https://arthals.ink"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500">
                            Arthals
                        </a>
                    </p>
                </footer>
            </div>
        </main>
    );
}
