"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { getGameRecords, deleteGameRecord } from "@/app/actions/games";
import { GameResult, Member } from "@/lib/schema";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EditGameDialog } from "./edit-game-dialog";

interface GameRecordWithResults {
  id: number;
  timestamp: string;
  results: GameResult[];
}

interface RecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordDeleted: () => void;
  members: Member[];
}

function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return "text-green-600 dark:text-green-400";
    case 2:
      return "text-blue-600 dark:text-blue-400";
    case 3:
      return "text-yellow-600 dark:text-yellow-400";
    case 4:
      return "text-red-600 dark:text-red-400";
    default:
      return "";
  }
}

export function RecordsDialog({
  open,
  onOpenChange,
  onRecordDeleted,
  members,
}: RecordsDialogProps) {
  const [records, setRecords] = useState<GameRecordWithResults[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<GameRecordWithResults | null>(null);

  useEffect(() => {
    if (open) {
      loadRecords();
    }
  }, [open]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await getGameRecords();
      setRecords(data);
    } catch {
      toast.error("加载记录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!confirm("是否要删除该记录？确认后将撤销在表格中进行的所有有关这条记录的操作。")) {
      return;
    }

    setDeletingId(recordId);
    try {
      const result = await deleteGameRecord(recordId);
      if (result.success) {
        toast.success("记录已删除");
        loadRecords();
        onRecordDeleted();
      }
    } catch {
      toast.error("删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (record: GameRecordWithResults) => {
    setEditingRecord(record);
  };

  const handleEditComplete = () => {
    loadRecords();
    onRecordDeleted(); // 刷新主页面数据
  };

  // Check if record has tied scores
  const hasTiedScores = (results: GameResult[]) => {
    const scores = results.map((r) => r.score);
    return new Set(scores).size !== scores.length;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>输入记录</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                加载中...
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无输入记录
              </div>
            ) : (
              records.map((record) => (
                <div
                  key={record.id}
                  className="bg-muted/50 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        第 {record.id} 轮输入 ({record.timestamp})
                      </h4>
                      {hasTiedScores(record.results) && (
                        <Badge variant="outline" className="text-orange-600">
                          含同分
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {record.results
                      .sort((a, b) => a.rank - b.rank)
                      .map((result, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-1 border-b border-dashed border-border last:border-0"
                        >
                          <span className="font-medium">
                            {result.rank}. {result.memberName}
                          </span>
                          <span className={cn("font-mono", getRankColor(result.rank))}>
                            {result.score * 100}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(record)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      修改
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      disabled={deletingId === record.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deletingId === record.id ? "删除中..." : "删除"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>返回主页面</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditGameDialog
        open={!!editingRecord}
        onOpenChange={(open) => !open && setEditingRecord(null)}
        gameId={editingRecord?.id || null}
        gameResults={editingRecord?.results || []}
        members={members}
        onGameUpdated={handleEditComplete}
      />
    </>
  );
}
