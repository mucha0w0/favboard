"use client";

import { cn } from "@/lib/utils";
import { Eye, Pencil } from "lucide-react";

export type ViewMode = "edit" | "preview";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const OPTIONS: { mode: ViewMode; label: string; icon: typeof Pencil }[] = [
  { mode: "edit", label: "編集", icon: Pencil },
  { mode: "preview", label: "プレビュー", icon: Eye },
];

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="表示モード"
      className="flex items-center rounded-full bg-stone-100 p-0.5"
    >
      {OPTIONS.map(({ mode, label, icon: Icon }) => {
        const selected = value === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => onChange(mode)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all sm:px-3 sm:text-xs",
              selected
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
