'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { ImportHistoryDialog } from '@/components/import-history-dialog';
import { getHistorySeasons, deleteHistorySeason, type HistorySeasonSummary } from '@/app/actions/history';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function HistoryPage() {
    const [seasons, setSeasons] = useState<HistorySeasonSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [importOpen, setImportOpen] = useState(false);

    const loadSeasons = useCallback(async () => {
        try {
            const data = await getHistorySeasons();
            setSeasons(data);
        } catch {
            toast.error('加载历史赛季失败');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSeasons();
    }, [loadSeasons]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`确定要删除「${name}」吗？此操作不可撤销。`)) return;

        try {
            const result = await deleteHistorySeason(id);
            if (result.success) {
                toast.success(result.message);
                loadSeasons();
            } else {
                toast.error(result.error || '删除失败');
            }
        } catch {
            toast.error('删除失败');
        }
    };

    return (
        <main className="min-h-screen bg-background">
            <div className="max-w-[1400px] mx-auto p-4 md:p-6">
                <header className="border-b pb-4 mb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h1 className="text-2xl font-bold text-foreground max-sm:m-auto">历史赛季</h1>
                        <div className="flex flex-wrap items-center gap-2 max-sm:mx-auto">
                            <Link href="/">
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    返回主页
                                </Button>
                            </Link>
                            <Button size="sm" onClick={() => setImportOpen(true)}>
                                <Upload className="h-4 w-4 mr-1" />
                                导入历史赛季
                            </Button>
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-lg text-muted-foreground">加载中...</div>
                    </div>
                ) : seasons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <p className="text-lg text-muted-foreground">暂无历史赛季数据</p>
                        <p className="text-sm text-muted-foreground">
                            点击&quot;导入历史赛季&quot;按钮，粘贴导出的 JSON 数据即可添加
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {seasons.map((season) => (
                            <Card key={season.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{season.name}</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDelete(season.id, season.name);
                                            }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p>半庄数：{season.hanchans}</p>
                                        <p>导入时间：{new Date(season.createdAt).toLocaleString('zh-CN')}</p>
                                    </div>
                                    <Link href={`/history/${season.id}`} className="block mt-4">
                                        <Button variant="outline" size="sm" className="w-full">
                                            查看详情
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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

            <ImportHistoryDialog open={importOpen} onOpenChange={setImportOpen} onImported={loadSeasons} />
        </main>
    );
}
