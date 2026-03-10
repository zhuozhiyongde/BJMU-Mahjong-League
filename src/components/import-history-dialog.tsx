'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { importHistorySeason } from '@/app/actions/history';
import { toast } from 'sonner';

interface ImportHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImported: () => void;
}

export function ImportHistoryDialog({ open, onOpenChange, onImported }: ImportHistoryDialogProps) {
    const [name, setName] = useState('');
    const [data, setData] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error('请输入赛季名称');
            return;
        }
        if (!data.trim()) {
            toast.error('请输入要导入的数据');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await importHistorySeason(name, data);
            if (result.success) {
                toast.success(result.message || '导入成功！');
                setName('');
                setData('');
                onOpenChange(false);
                onImported();
            } else {
                toast.error(result.error || '导入失败');
            }
        } catch {
            toast.error('导入失败，请检查数据格式');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>导入历史赛季</DialogTitle>
                    <DialogDescription>
                        请输入赛季名称，并粘贴从&quot;导出数据&quot;功能导出的 JSON 数据。导入后可在历史赛季页面查看。
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0 py-4 space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">赛季名称</label>
                        <Input
                            placeholder="例如：Season 3"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 min-h-0">
                        <label className="text-sm font-medium mb-1.5 block">对局数据 (JSON)</label>
                        <Textarea
                            placeholder="请在此处粘贴导出的 JSON 数据..."
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            className="font-mono text-sm min-h-[200px] max-h-[40vh] resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? '导入中...' : '确认导入'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
