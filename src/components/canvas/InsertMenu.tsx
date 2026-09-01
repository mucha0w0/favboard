"use client";

import { type BlockType } from "@/lib/types";
import { AlignLeft, Minus, Package, Plus, Type } from "lucide-react";
import { useState } from "react";

interface InsertMenuProps {
  onAdd: (type: BlockType) => void;
  disabled?: boolean;
}

const ITEMS: { type: BlockType; label: string; icon: typeof Package }[] = [
  { type: "product", label: "商品", icon: Package },
  { type: "text", label: "テキスト", icon: AlignLeft },
  { type: "heading", label: "見出し", icon: Type },
  { type: "divider", label: "区切り線", icon: Minus },
];

export function InsertMenu({ onAdd, disabled }: InsertMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mt-10">
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-20 mb-2 min-w-[168px] rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
            {ITEMS.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                disabled={disabled}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                onClick={() => {
                  onAdd(type);
                  setOpen(false);
                }}
              >
                <Icon className="h-4 w-4 text-stone-400" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-600 shadow-sm transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:opacity-50"
        aria-label="ブロックを追加"
      >
        <Plus
          className={`h-5 w-5 transition-transform ${open ? "rotate-45" : ""}`}
        />
      </button>
    </div>
  );
}

/** @deprecated Use InsertMenu */
export const AddBlockBar = InsertMenu;
