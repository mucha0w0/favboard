"use client";

import { type Block, type BlockType } from "@/lib/types";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { BlockRenderer } from "./BlockRenderer";

interface BlockStreamProps {
  blocks: Block[];
  editable?: boolean;
  onEditBlock?: (block: Block) => void;
  onDeleteBlock?: (blockId: string) => void;
}

export function createBlock(type: BlockType): Block {
  return {
    id: crypto.randomUUID(),
    type,
    data:
      type === "heading"
        ? { text: "新しい見出し" }
        : type === "product"
          ? {}
          : {},
  };
}

const TYPE_LABELS: Record<BlockType, string> = {
  product: "商品",
  heading: "見出し",
  divider: "区切り線",
};

function blockClass(type: BlockType): string {
  switch (type) {
    case "heading":
      return "block-heading";
    case "product":
      return "block-product";
    case "divider":
      return "block-divider";
  }
}

export function BlockStream({
  blocks,
  editable = false,
  onEditBlock,
  onDeleteBlock,
}: BlockStreamProps) {
  return (
    <div className="document-body w-full">
      {blocks.length === 0 && editable && (
        <p className="py-12 text-[15px] leading-relaxed text-stone-400">
          左下の ＋ から、商品・見出し・区切り線を追加できます
        </p>
      )}

      {blocks.map((block) => (
        <BlockItem
          key={block.id}
          block={block}
          editable={editable}
          onEditBlock={onEditBlock}
          onDeleteBlock={onDeleteBlock}
        />
      ))}
    </div>
  );
}

function BlockItem({
  block,
  editable,
  onEditBlock,
  onDeleteBlock,
}: {
  block: Block;
  editable: boolean;
  onEditBlock?: (block: Block) => void;
  onDeleteBlock?: (blockId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleDelete() {
    if (!onDeleteBlock) return;
    const label = TYPE_LABELS[block.type];
    if (!confirm(`この${label}を削除しますか？`)) return;
    onDeleteBlock(block.id);
    setMenuOpen(false);
  }

  return (
    <div
      className={`group/block relative ${blockClass(block.type)} ${
        editable && block.type !== "product"
          ? "rounded-sm hover:bg-stone-200/40"
          : ""
      }`}
    >
      {editable && (
        <div className="absolute -right-1 top-0 z-10 sm:-right-10">
          <button
            type="button"
            className="rounded-md p-1.5 text-stone-300 opacity-0 transition-opacity hover:bg-stone-100 hover:text-stone-600 group-hover/block:opacity-100 data-[open=true]:opacity-100"
            data-open={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="操作メニュー"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-20 min-w-[120px] rounded-lg border border-stone-200/80 bg-white py-1 shadow-lg">
                {block.type !== "divider" && onEditBlock && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-50"
                    onClick={() => {
                      onEditBlock(block);
                      setMenuOpen(false);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    編集
                  </button>
                )}
                {onDeleteBlock && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    削除
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {editable && block.type === "product" ? (
        <button
          type="button"
          className="w-full cursor-pointer text-left"
          onClick={() => onEditBlock?.(block)}
        >
          <BlockRenderer block={block} editable={editable} />
        </button>
      ) : editable && block.type === "heading" ? (
        <button
          type="button"
          className="w-full cursor-pointer text-left"
          onClick={() => onEditBlock?.(block)}
        >
          <BlockRenderer block={block} editable={editable} />
        </button>
      ) : (
        <BlockRenderer block={block} editable={editable} />
      )}
    </div>
  );
}

/** @deprecated Use BlockStream */
export const CardStack = BlockStream;
