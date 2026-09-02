"use client";

import { type BlockType } from "@/lib/types";
import { AlignLeft, Minus, Package, Plus, Type } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
          <div className="menu-float absolute bottom-full left-0 z-20 mb-2 min-w-[160px] py-1">
            {ITEMS.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                disabled={disabled}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-stone-600 transition-colors hover:text-stone-900 disabled:opacity-50"
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
      <Button
        type="button"
        size="icon"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="rounded-full"
        aria-label="ブロックを追加"
      >
        <Plus
          className={`h-4 w-4 transition-transform ${open ? "rotate-45" : ""}`}
        />
      </Button>
    </div>
  );
}

/** @deprecated Use InsertMenu */
export const AddBlockBar = InsertMenu;
