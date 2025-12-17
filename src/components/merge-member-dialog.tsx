"use client";

import { useState } from "react";
import { Member } from "@/lib/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { mergeMembers } from "@/app/actions/members";
import { toast } from "sonner";

interface MergeMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  onMergeComplete: () => void;
}

export function MergeMemberDialog({
  open,
  onOpenChange,
  members,
  onMergeComplete,
}: MergeMemberDialogProps) {
  const [targetName, setTargetName] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!targetName) {
      toast.error("请选择目标选手（保留）");
      return;
    }

    if (!sourceName) {
      toast.error("请选择源选手（合并后删除）");
      return;
    }

    if (targetName === sourceName) {
      toast.error("不能将选手合并到自己");
      return;
    }

    if (!confirm(`确定要将 "${sourceName}" 的所有数据合并到 "${targetName}" 吗？\n\n合并后 "${sourceName}" 将被删除，其所有对局记录将归属于 "${targetName}"。此操作不可撤销！`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await mergeMembers(targetName, sourceName);
      if (result.success) {
        toast.success(result.message || "合并成功");
        setTargetName("");
        setSourceName("");
        onOpenChange(false);
        onMergeComplete();
      } else {
        toast.error(result.error || "合并失败");
      }
    } catch {
      toast.error("合并失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTargetName("");
    setSourceName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>合并选手</DialogTitle>
          <DialogDescription>
            将一个选手的所有对局数据合并到另一个选手，适用于同一人使用不同名字参赛的情况。
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            合并后源选手将被删除，所有对局记录将归属于目标选手。此操作不可撤销！
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">目标选手（保留）:</label>
            <Select value={targetName} onValueChange={setTargetName}>
              <SelectTrigger>
                <SelectValue placeholder="选择要保留的选手" />
              </SelectTrigger>
              <SelectContent>
                {members
                  .filter((m) => m.name !== sourceName)
                  .map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name} ({member.games}场)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">源选手（合并后删除）:</label>
            <Select value={sourceName} onValueChange={setSourceName}>
              <SelectTrigger>
                <SelectValue placeholder="选择要合并的选手" />
              </SelectTrigger>
              <SelectContent>
                {members
                  .filter((m) => m.name !== targetName)
                  .map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name} ({member.games}场)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {targetName && sourceName && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              将 <strong>{sourceName}</strong> 的所有对局记录合并到{" "}
              <strong>{targetName}</strong>，然后删除 <strong>{sourceName}</strong>。
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !targetName || !sourceName}
          >
            {isSubmitting ? "合并中..." : "确认合并"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
