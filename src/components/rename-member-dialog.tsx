"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameMember } from "@/app/actions/members";
import { toast } from "sonner";

interface RenameMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string | null;
  onMemberRenamed: () => void;
}

export function RenameMemberDialog({
  open,
  onOpenChange,
  memberName,
  onMemberRenamed,
}: RenameMemberDialogProps) {
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNewName("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!memberName) return;

    if (!newName.trim()) {
      toast.error("请输入新的选手姓名");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await renameMember(memberName, newName);
      if (result.success) {
        toast.success(`选手已从 "${memberName}" 重命名为 "${newName}"`);
        onOpenChange(false);
        onMemberRenamed();
      } else {
        toast.error(result.error || "重命名失败");
      }
    } catch {
      toast.error("重命名失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重命名选手</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">当前姓名:</label>
            <Input value={memberName || ""} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">新姓名:</label>
            <Input
              placeholder="输入新的选手姓名"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "确认重命名"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
