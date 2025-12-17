"use client";

import { useState } from "react";
import { Member } from "@/lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Check, RotateCcw, AlertCircle } from "lucide-react";
import { submitGame } from "@/app/actions/games";
import { toast } from "sonner";

interface InputSectionProps {
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

export function InputSection({
  members,
  onAddMember,
  onGameSubmitted,
}: InputSectionProps) {
  const [players, setPlayers] = useState<PlayerInput[]>(initialPlayers);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleReset = () => {
    setPlayers(initialPlayers);
    setError(null);
  };

  const handleSubmit = async () => {
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
      const result = await submitGame(
        players.map((p, i) => ({
          memberName: p.memberName,
          score: scores[i],
        }))
      );

      if (result.success) {
        toast.success("本轮输入已成功保存");
        handleReset();
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
    <Card>
      <CardHeader>
        <CardTitle>输入界面</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.map((player, index) => (
            <div key={index} className="space-y-2">
              <label className="text-sm font-medium">选手 {index + 1}:</label>
              <Select
                value={player.memberName}
                onValueChange={(value) => handleMemberChange(index, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择选手" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMembers(index).map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {player.memberName && (
                <div className="text-sm text-muted-foreground bg-primary/5 p-2 rounded border-l-2 border-primary">
                  已选择: {player.memberName}
                </div>
              )}
              <Input
                type="number"
                placeholder="输入分数"
                value={player.score}
                onChange={(e) => handleScoreChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Button variant="outline" onClick={onAddMember}>
            <Plus className="h-4 w-4 mr-1" />
            添加选手
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Check className="h-4 w-4 mr-1" />
            {isSubmitting ? "提交中..." : "完成输入"}
          </Button>
          <Button variant="destructive" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            重置本轮
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
