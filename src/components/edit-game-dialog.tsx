"use client";

import { useState, useEffect } from "react";
import { Member, GameResult } from "@/lib/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { updateGameRecord } from "@/app/actions/games";
import { toast } from "sonner";

interface EditGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: number | null;
  gameResults: GameResult[];
  members: Member[];
  onGameUpdated: () => void;
}

interface PlayerInput {
  memberName: string;
  score: string;
}

export function EditGameDialog({
  open,
  onOpenChange,
  gameId,
  gameResults,
  members,
  onGameUpdated,
}: EditGameDialogProps) {
  const [players, setPlayers] = useState<PlayerInput[]>([
    { memberName: "", score: "" },
    { memberName: "", score: "" },
    { memberName: "", score: "" },
    { memberName: "", score: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当打开对话框时，加载现有数据
  useEffect(() => {
    if (open && gameResults.length === 4) {
      const sortedResults = [...gameResults].sort((a, b) => b.score - a.score);
      setPlayers(
        sortedResults.map((r) => ({
          memberName: r.memberName,
          score: r.score.toString(),
        }))
      );
      setError(null);
    }
  }, [open, gameResults]);

  const selectedMembers = players.map((p) => p.memberName).filter(Boolean);

  const getAvailableMembers = (currentIndex: number) => {
    return members.filter(
      (m) =>
        !selectedMembers.includes(m.name) ||
        m.name === players[currentIndex].memberName
    );
  };

  const handleMemberChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], memberName: value };
    setPlayers(newPlayers);
    setError(null);
  };

  const handleScoreChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], score: value };
    setPlayers(newPlayers);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!gameId) return;

    // Validate all players selected
    for (let i = 0; i < 4; i++) {
      if (!players[i].memberName) {
        setError(`请选择第 ${i + 1} 位选手`);
        return;
      }
      if (!players[i].score) {
        setError(`请输入第 ${i + 1} 位选手的分数`);
        return;
      }
    }

    // Validate unique members
    const uniqueMembers = new Set(players.map((p) => p.memberName));
    if (uniqueMembers.size !== 4) {
      setError("不能选择重复的选手");
      return;
    }

    // Validate score sum
    const scores = players.map((p) => parseFloat(p.score));
    if (scores.some(isNaN)) {
      setError("请输入有效的分数");
      return;
    }

    const sum = scores.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1000) > 0.001) {
      setError(`四个分数之和必须等于1000，当前总和为 ${sum}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateGameRecord(
        gameId,
        players.map((p, i) => ({
          memberName: p.memberName,
          score: scores[i],
        }))
      );

      if (result.success) {
        toast.success("对局记录已更新");
        onOpenChange(false);
        onGameUpdated();
      } else {
        setError(result.error || "更新失败");
      }
    } catch {
      setError("更新失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>修改对局 #{gameId}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          {players.map((player, index) => (
            <div key={index} className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  选手 {index + 1}
                </label>
                <Select
                  value={player.memberName}
                  onValueChange={(value) => handleMemberChange(index, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择选手" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableMembers(index).map((member) => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">分数</label>
                <Input
                  type="number"
                  placeholder="分数"
                  value={player.score}
                  onChange={(e) => handleScoreChange(index, e.target.value)}
                />
              </div>
            </div>
          ))}

          <div className="text-sm text-muted-foreground">
            当前总分:{" "}
            {players.reduce((sum, p) => sum + (parseFloat(p.score) || 0), 0)}
            （需要等于1000）
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存修改"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
