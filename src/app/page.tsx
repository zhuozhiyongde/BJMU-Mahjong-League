'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/header';
import { SeasonInfo } from '@/components/season-info';
import { ScoreTable } from '@/components/score-table';
import { AddMemberDialog } from '@/components/add-member-dialog';
import { RenameMemberDialog } from '@/components/rename-member-dialog';
import { DeleteMemberDialog } from '@/components/delete-member-dialog';
import { MergeMemberDialog } from '@/components/merge-member-dialog';
import { RecordsDialog } from '@/components/records-dialog';
import { ImportDialog } from '@/components/import-dialog';
import { InputDialog } from '@/components/input-dialog';
import { getMembers } from '@/app/actions/members';
import { clearAllGameHistory, getSeasonStats } from '@/app/actions/games';
import { exportData, checkImportEnabled } from '@/app/actions/data';
import { Member } from '@/lib/schema';
import { toast } from 'sonner';

export default function Home() {
    const [members, setMembers] = useState<Member[]>([]);
    const [hanchans, setHanchans] = useState(0);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [importEnabled, setImportEnabled] = useState(true);

    // Dialog states
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [renameMemberOpen, setRenameMemberOpen] = useState(false);
    const [deleteMemberOpen, setDeleteMemberOpen] = useState(false);
    const [mergeMemberOpen, setMergeMemberOpen] = useState(false);
    const [recordsOpen, setRecordsOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [inputOpen, setInputOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [membersData, statsData, importEnabledData] = await Promise.all([
                getMembers(),
                getSeasonStats(),
                checkImportEnabled(),
            ]);
            setMembers(membersData);
            setHanchans(statsData.hanchans);
            setImportEnabled(importEnabledData);
            setLastUpdateTime(new Date().toLocaleString('zh-CN'));
        } catch {
            toast.error('加载数据失败');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleExport = async () => {
        try {
            const data = await exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BJMU_League_Season3_数据备份_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('数据导出成功！');
        } catch {
            toast.error('导出失败');
        }
    };

    const handleRename = (name: string) => {
        setSelectedMember(name);
        setRenameMemberOpen(true);
    };

    const handleDelete = (name: string) => {
        setSelectedMember(name);
        setDeleteMemberOpen(true);
    };

    const handleClearHistory = async () => {
        const confirmed = confirm('将删除所有对局记录与所有选手数据。确定继续吗？');
        if (!confirmed) return;

        const confirmedAgain = confirm('再次确认：此操作不可撤销。确定清空全部数据？');
        if (!confirmedAgain) return;

        try {
            const result = await clearAllGameHistory();
            if (result.success) {
                toast.success(result.message || '已清空对战历史');
                await loadData();
            } else {
                toast.error(result.error || '清空失败');
            }
        } catch {
            toast.error('清空失败');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg text-muted-foreground">加载中...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="max-w-[1400px] mx-auto p-4 md:p-6">
                <Header
                    onExport={handleExport}
                    onImport={() => setImportOpen(true)}
                    onViewRecords={() => setRecordsOpen(true)}
                    onMergeMembers={() => setMergeMemberOpen(true)}
                    onInputGame={() => setInputOpen(true)}
                    onClearHistory={handleClearHistory}
                    onManageMembers={() => setAddMemberOpen(true)}
                    importEnabled={importEnabled}
                />

                <SeasonInfo hanchans={hanchans} />

                <ScoreTable members={members} onRename={handleRename} onDelete={handleDelete} lastUpdateTime={lastUpdateTime} />

                <footer className="mt-8 text-center text-sm text-muted-foreground py-4 border-t">
                    <p>BJMU League Season3 计分系统 &copy; 2025 <a href="https://arthals.ink" target="_blank" rel="noopener noreferrer" className="text-blue-500">Arthals</a></p>
                </footer>
            </div>

            <AddMemberDialog open={addMemberOpen} onOpenChange={setAddMemberOpen} onMemberAdded={loadData} />

            <RenameMemberDialog
                open={renameMemberOpen}
                onOpenChange={setRenameMemberOpen}
                memberName={selectedMember}
                onMemberRenamed={loadData}
            />

            <DeleteMemberDialog
                open={deleteMemberOpen}
                onOpenChange={setDeleteMemberOpen}
                memberName={selectedMember}
                onMemberDeleted={loadData}
            />

            <MergeMemberDialog
                open={mergeMemberOpen}
                onOpenChange={setMergeMemberOpen}
                members={members}
                onMergeComplete={loadData}
            />

            <RecordsDialog
                open={recordsOpen}
                onOpenChange={setRecordsOpen}
                onRecordDeleted={loadData}
                members={members}
            />

            <ImportDialog open={importOpen} onOpenChange={setImportOpen} onDataImported={loadData} />

            <InputDialog
                open={inputOpen}
                onOpenChange={setInputOpen}
                members={members}
                onAddMember={() => setAddMemberOpen(true)}
                onGameSubmitted={loadData}
            />
        </main>
    );
}
