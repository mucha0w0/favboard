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
      className="inline-flex h-8 items-center rounded-full border border-stone-200 bg-white p-0.5"
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
              "inline-flex h-full items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors sm:px-3",
              selected
                ? "bg-stone-900 text-white"
                : "text-stone-500 hover:text-stone-900",
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
