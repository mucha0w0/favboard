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

/** ネストした Bento 子を含めて商品画像 URL を集める */
export function collectProductImages(blocks: Block[], limit = 1): string[] {
  const images: string[] = [];

  const visit = (items: Block[]) => {
    for (const block of items) {
      if (images.length >= limit) return;
      if (block.type === "product" && block.data.image_url) {
        images.push(block.data.image_url);
      } else if (block.type === "bento") {
        visit(block.data.children ?? []);
      }
    }
  };

  visit(blocks);
  return images;
}

/** ネストした Bento 子を含めて最初の商品画像を探す */
export function findFirstProductImage(blocks: Block[]): string | undefined {
  return collectProductImages(blocks, 1)[0];
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

export function canvasOgImagePath(slug: string, cacheKey?: string): string {
  const path = `${canvasPublicPath(slug)}/opengraph-image`;
  if (!cacheKey) return path;
  return `${path}?v=${encodeURIComponent(cacheKey)}`;
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
