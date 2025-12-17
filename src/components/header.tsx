"use client";

import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Download, Upload, History, GitMerge, Plus, Trash2, UserPlus } from "lucide-react";

interface HeaderProps {
  onExport: () => void;
  onImport: () => void;
  onViewRecords: () => void;
  onMergeMembers: () => void;
  onInputGame: () => void;
  onClearHistory: () => void;
  onManageMembers: () => void;
  importEnabled?: boolean;
}

export function Header({
  onExport,
  onImport,
  onViewRecords,
  onMergeMembers,
  onInputGame,
  onClearHistory,
  onManageMembers,
  importEnabled = true,
}: HeaderProps) {
  return (
    <header className="border-b border-primary pb-4 mb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          BJMU League Season3 计分系统
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={onInputGame}>
            <Plus className="h-4 w-4 mr-1" />
            录入对局
          </Button>
          <Button variant="outline" size="sm" onClick={onManageMembers}>
            <UserPlus className="h-4 w-4 mr-1" />
            管理选手
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-1" />
            导出数据
          </Button>
          {importEnabled && (
            <Button variant="outline" size="sm" onClick={onImport}>
              <Upload className="h-4 w-4 mr-1" />
              导入对局
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onViewRecords}>
            <History className="h-4 w-4 mr-1" />
            查看记录
          </Button>
          {importEnabled && (
            <Button variant="destructive" size="sm" onClick={onClearHistory}>
              <Trash2 className="h-4 w-4 mr-1" />
              清空全部数据
            </Button>
          )}
          {importEnabled && (
            <Button variant="outline" size="sm" onClick={onMergeMembers}>
              <GitMerge className="h-4 w-4 mr-1" />
              合并选手
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
