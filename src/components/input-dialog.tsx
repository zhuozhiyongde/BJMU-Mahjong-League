"use client";

import { useState } from "react";
import { Member } from "@/lib/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Check, RotateCcw, AlertCircle, Copy } from "lucide-react";
import { submitGame } from "@/app/actions/games";
import { toast } from "sonner";

interface InputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  onAddMember: () => void;
  onGameSubmitted: () => void;
}

interface PlayerInput {
  memberName: string;
  score: string;
}

const initialPlayers: PlayerInput[] = [
  { memberName: "", score: "" },
  { memberName: "", score: "" },
  { memberName: "", score: "" },
  { memberName: "", score: "" },
];

interface SubmittedGame {
  timestamp: string;
  players: { memberName: string; score: number }[];
}

export function InputDialog({
  open,
  onOpenChange,
  members,
  onAddMember,
  onGameSubmitted,
}: InputDialogProps) {
  const [players, setPlayers] = useState<PlayerInput[]>(initialPlayers);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedGame, setLastSubmittedGame] = useState<SubmittedGame | null>(null);

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

  const handleReset = () => {
    setPlayers(initialPlayers);
    setError(null);
    setLastSubmittedGame(null);
  };

  const handleCopyLastGame = async () => {
    if (!lastSubmittedGame) return;

    const sortedPlayers = [...lastSubmittedGame.players].sort((a, b) => b.score - a.score);
    const lines = [
      `【${lastSubmittedGame.timestamp}】`,
      ...sortedPlayers.map((p) => `@${p.memberName} ${p.score * 100}`)
    ];
    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success("已复制到剪贴板");
    } catch {
      toast.error("复制失败");
    }
  };

  const handleSubmit = async () => {
    // Validate all players selected
    for (let i = 0; i < 4; i++) {
      if (!players[i].memberName.trim()) {
        setError(`请选择第 ${i + 1} 位选手`);
        return;
      }
      if (!players[i].score) {
        setError(`请输入第 ${i + 1} 位选手的分数`);
        return;
      }
    }

    // Validate unique members
    const memberNames = players.map((p) => p.memberName.trim());
    const uniqueMembers = new Set(memberNames);
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
      const result = await submitGame(
        players.map((p, i) => ({
          memberName: p.memberName.trim(),
          score: scores[i],
        }))
      );

      if (result.success) {
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        setLastSubmittedGame({
          timestamp,
          players: players.map((p, i) => ({
            memberName: p.memberName.trim(),
            score: scores[i],
          })),
        });
        toast.success("对局录入成功");
        setPlayers(initialPlayers);
        setError(null);
        onGameSubmitted();
      } else {
        setError(result.error || "提交失败");
      }
    } catch {
      setError("提交失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>录入对局</DialogTitle>
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
                <Input
                  value={player.memberName}
                  placeholder="输入或选择选手"
                  list={`member-names-${index}`}
                  onChange={(e) => handleMemberChange(index, e.target.value)}
                />
                <datalist id={`member-names-${index}`}>
                  {members.map((m) => (
                    <option key={m.id} value={m.name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  分数 (如 500 表示 50000 点)
                </label>
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

        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={onAddMember}>
            <Plus className="h-4 w-4 mr-1" />
            添加选手
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Check className="h-4 w-4 mr-1" />
            {isSubmitting ? "提交中..." : "完成录入"}
          </Button>
          {lastSubmittedGame && (
            <Button variant="outline" onClick={handleCopyLastGame}>
              <Copy className="h-4 w-4 mr-1" />
              复制
            </Button>
          )}
          <Button variant="destructive" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            重置
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
