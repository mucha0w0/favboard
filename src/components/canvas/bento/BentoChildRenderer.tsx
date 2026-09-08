"use client";

import type { Block, BlockData } from "@/lib/types";
import { ProductBlock } from "../blocks/ProductBlock";
import { TextBlock } from "../blocks/TextBlock";

/** Bento 子専用 — BlockRenderer を経由せず循環参照を避ける */
export function BentoChildRenderer({
  block,
  editable,
  autoFocus,
  cellSpan,
  onUpdateBlockData,
  onBlockBlur,
}: {
  block: Block;
  editable?: boolean;
  autoFocus?: boolean;
  cellSpan?: { colSpan: number; rowSpan: number };
  onUpdateBlockData?: (blockId: string, data: Partial<BlockData>) => void;
  onBlockBlur?: (blockId: string) => void;
}) {
  if (block.type === "product") {
    return (
      <ProductBlock
        block={block}
        showPlaceholders={editable}
        layout="grid"
        cellSpan={cellSpan}
      />
    );
  }

  if (block.type === "text") {
    return (
      <TextBlock
        block={block}
        showPlaceholders={editable}
        editable={editable}
        autoFocus={autoFocus}
        onUpdate={(body) => onUpdateBlockData?.(block.id, { body })}
        onBlur={() => onBlockBlur?.(block.id)}
      />
    );
  }

  return null;
}
