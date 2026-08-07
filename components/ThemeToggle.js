"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { classNames } from "@/lib/utils";

export default function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={classNames(
        "w-9 h-9 flex items-center justify-center rounded-full border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors shrink-0",
        className
      )}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
