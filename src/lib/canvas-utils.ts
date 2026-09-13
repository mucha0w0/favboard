import type { Block, Canvas } from "@/lib/types";
import { migrateCanvasBlocks } from "@/lib/bento";

export const MAX_CANVASES_PER_USER = 3;

export const CANVAS_LIMIT_MESSAGE = `リストは1人あたり${MAX_CANVASES_PER_USER}つまでです`;

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

export function canvasPublicPath(slug: string): string {
  return `/c/${slug}`;
}

export function canvasShareUrl(slug: string, origin?: string): string {
  const base = (
    origin ??
    (typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  ).replace(/\/$/, "");
  return `${base}${canvasPublicPath(slug)}`;
}

export function canvasTweetIntentUrl(title: string, shareUrl: string): string {
  const text = `${title} — Favboard`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
}
