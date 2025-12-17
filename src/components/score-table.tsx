"use client";

import { Member } from "@/lib/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreTableProps {
  members: Member[];
  onRename: (name: string) => void;
  onDelete: (name: string) => void;
  lastUpdateTime?: string;
}

function formatPoints(points: number): string {
  return points.toFixed(1);
}

function calculateAvgRank(member: Member): string {
  if (member.games === 0) return "0";
  const avgRank =
    (member.first * 1 +
      member.second * 2 +
      member.third * 3 +
      member.fourth * 4) /
    member.games;
  return avgRank.toFixed(2);
}

function calculateFirstRate(member: Member): string {
  if (member.games === 0) return "0%";
  return ((member.first / member.games) * 100).toFixed(1) + "%";
}

function calculateFourthAvoidRate(member: Member): string {
  if (member.games === 0) return "100%";
  return ((1 - member.fourth / member.games) * 100).toFixed(1) + "%";
}

export function ScoreTable({
  members,
  onRename,
  onDelete,
  lastUpdateTime,
}: ScoreTableProps) {
  const columnCount = 16;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle>BJMU League Season3 成绩表</CardTitle>
          {lastUpdateTime && (
            <span className="text-sm text-muted-foreground">
              最后更新: {lastUpdateTime}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-12">排名</TableHead>
                <TableHead className="text-center">选手</TableHead>
                <TableHead className="text-center">积分</TableHead>
                <TableHead className="text-center">素点</TableHead>
                <TableHead className="text-center">场数</TableHead>
                <TableHead className="text-center bg-green-500/10">一位</TableHead>
                <TableHead className="text-center bg-blue-500/10">二位</TableHead>
                <TableHead className="text-center bg-yellow-500/10">三位</TableHead>
                <TableHead className="text-center bg-red-500/10">四位</TableHead>
                <TableHead className="text-center">平均顺位</TableHead>
                <TableHead className="text-center">吃一率</TableHead>
                <TableHead className="text-center">避四率</TableHead>
                <TableHead className="text-center">半庄最高分</TableHead>
                <TableHead className="text-center">猫猫头次数</TableHead>
                <TableHead className="text-center">被飞次数</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="text-center py-8 text-muted-foreground">
                    暂无选手数据，请先添加选手
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member, index) => (
                  <TableRow key={member.id}>
                    <TableCell className="text-center font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {member.name}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-center font-medium",
                        member.points >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {formatPoints(member.points)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-center",
                        member.basePoints >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {formatPoints(member.basePoints)}
                    </TableCell>
                    <TableCell className="text-center">{member.games}</TableCell>
                    <TableCell className="text-center bg-green-500/10">
                      {member.first}
                    </TableCell>
                    <TableCell className="text-center bg-blue-500/10">
                      {member.second}
                    </TableCell>
                    <TableCell className="text-center bg-yellow-500/10">
                      {member.third}
                    </TableCell>
                    <TableCell className="text-center bg-red-500/10">
                      {member.fourth}
                    </TableCell>
                    <TableCell className="text-center">
                      {calculateAvgRank(member)}
                    </TableCell>
                    <TableCell className="text-center">
                      {calculateFirstRate(member)}
                    </TableCell>
                    <TableCell className="text-center">
                      {calculateFourthAvoidRate(member)}
                    </TableCell>
                    <TableCell className="text-center text-purple-600 dark:text-purple-400">
                      {member.highestScore ?? 0}
                    </TableCell>
                    <TableCell className="text-center text-orange-600 dark:text-orange-400">
                      {member.catCount}
                    </TableCell>
                    <TableCell className="text-center text-red-600 dark:text-red-400">
                      {member.negativeCount}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onRename(member.name)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDelete(member.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
