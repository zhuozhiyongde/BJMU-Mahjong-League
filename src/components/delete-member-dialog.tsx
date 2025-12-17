"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteMember } from "@/app/actions/members";
import { toast } from "sonner";
import { useState } from "react";

interface DeleteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string | null;
  onMemberDeleted: () => void;
}

export function DeleteMemberDialog({
  open,
  onOpenChange,
  memberName,
  onMemberDeleted,
}: DeleteMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!memberName) return;

    setIsSubmitting(true);
    try {
      const result = await deleteMember(memberName);
      if (result.success) {
        toast.success(`选手 "${memberName}" 已删除`);
        onOpenChange(false);
        onMemberDeleted();
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch {
      toast.error("删除失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            是否要删除选手 &ldquo;{memberName}&rdquo;？这将删除该选手的所有数据以及相关的输入记录。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
