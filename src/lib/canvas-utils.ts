import type { Block, Canvas } from "@/lib/types";
import { migrateCanvasBlocks } from "@/lib/bento";

/** ネストした Bento 子を含めて商品数を数える */
export function countProducts(blocks: Block[]): number {
  return blocks.reduce((count, block) => {
    if (block.type === "product") return count + 1;
    if (block.type === "bento") {
      return count + countProducts(block.data.children ?? []);
    }
    return count;
  }, 0);
}

/** ネストした Bento 子を含めて最初の商品画像を探す */
export function findFirstProductImage(blocks: Block[]): string | undefined {
  for (const block of blocks) {
    if (block.type === "product" && block.data.image_url) {
      return block.data.image_url;
    }
    if (block.type === "bento") {
      const nested = findFirstProductImage(block.data.children ?? []);
      if (nested) return nested;
    }
  }
  return undefined;
}

export function normalizeCanvas(canvas: Canvas): Canvas {
  return {
    ...canvas,
    blocks: migrateCanvasBlocks(canvas.blocks),
  };
}
