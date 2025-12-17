"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const currentTheme = mounted ? theme ?? "system" : "system";

  const cycleTheme = React.useCallback(() => {
    const next =
      currentTheme === "light"
        ? "dark"
        : currentTheme === "dark"
          ? "system"
          : "light";
    setTheme(next);
  }, [currentTheme, setTheme]);

  return (
    <Button variant="outline" size="icon-sm" onClick={cycleTheme}>
      {currentTheme === "light" ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : currentTheme === "dark" ? (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Monitor className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">切换主题（浅色 / 深色 / 跟随系统）</span>
    </Button>
  );
}
