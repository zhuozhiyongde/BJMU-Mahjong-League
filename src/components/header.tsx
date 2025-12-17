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
        <h1 className="text-2xl font-bold text-foreground max-sm:m-auto">
          BJMU League Season3 计分系统
        </h1>
        <div className="flex flex-wrap items-center gap-2 max-sm:mx-auto">
          <Button
            size="sm"
            onClick={onInputGame}
            className="w-8 px-0 has-[>svg]:px-0 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
          >
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="max-sm:hidden">录入对局</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onManageMembers}
            className="w-8 px-0 has-[>svg]:px-0 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
          >
            <UserPlus className="h-4 w-4 sm:mr-1" />
            <span className="max-sm:hidden">管理选手</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="w-8 px-0 has-[>svg]:px-0 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
          >
            <Download className="h-4 w-4 sm:mr-1" />
            <span className="max-sm:hidden">导出数据</span>
          </Button>
          {importEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={onImport}
              className="w-8 px-0 has-[>svg]:px-0 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
            >
              <Upload className="h-4 w-4 sm:mr-1" />
              <span className="max-sm:hidden">导入对局</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onViewRecords}
            className="w-8 px-0 has-[>svg]:px-0 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
          >
            <History className="h-4 w-4 sm:mr-1" />
            <span className="max-sm:hidden">查看记录</span>
          </Button>
          {importEnabled && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onClearHistory}
              className="w-8 px-0 has-[>svg]:px-0 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
            >
              <Trash2 className="h-4 w-4 sm:mr-1" />
              <span className="max-sm:hidden">清空全部数据</span>
            </Button>
          )}
          {importEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMergeMembers}
              className="w-8 px-0 has-[>svg]:px-0 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
            >
              <GitMerge className="h-4 w-4 sm:mr-1" />
              <span className="max-sm:hidden">合并选手</span>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
