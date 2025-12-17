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
import { Textarea } from '@/components/ui/textarea';
import { importLegacyData } from '@/app/actions/data';
import { toast } from 'sonner';

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDataImported: () => void;
}

export function ImportDialog({ open, onOpenChange, onDataImported }: ImportDialogProps) {
    const [data, setData] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!data.trim()) {
            toast.error('请输入要导入的数据');
            return;
        }

        if (!confirm('导入数据将覆盖当前所有数据，确定要导入吗？')) {
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await importLegacyData(data);
            if (result.success) {
                toast.success(result.message || '数据导入成功！');
                // 输出跳过的错误记录到 console
                if (result.skippedRecords && result.skippedRecords.length > 0) {
                    console.group(`导入数据时跳过了 ${result.skippedRecords.length} 条无效记录：`);
                    result.skippedRecords.forEach((item) => {
                        console.group(`记录 #${item.index + 1} - 错误: ${item.error}`);
                        console.log('原始数据:', item.raw);
                        console.groupEnd();
                    });
                    console.groupEnd();
                }
                setData('');
                onOpenChange(false);
                onDataImported();
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
                    <DialogTitle>导入数据</DialogTitle>
                    <DialogDescription>
                        请粘贴从原设备导出的数据。提示：请在原设备点击&quot;导出数据&quot;按钮，将下载的JSON文件内容复制粘贴到这里。
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0 py-4">
                    <Textarea
                        placeholder="请在此处粘贴导出的数据..."
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="font-mono text-sm h-full min-h-[200px] max-h-[50vh] resize-none"
                    />
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
