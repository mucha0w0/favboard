"use client";

import { BlockStream } from "@/components/canvas/BlockStream";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { migrateCanvasBlocks } from "@/lib/bento-layout";
import { type Block, type Canvas } from "@/lib/types";
import { Share2 } from "lucide-react";

interface PublicCanvasViewProps {
  canvas: Canvas;
  shareUrl: string;
  isDraftPreview?: boolean;
}

export function PublicCanvasView({
  canvas,
  shareUrl,
  isDraftPreview = false,
}: PublicCanvasViewProps) {
  function handleShare() {
    const text = `${canvas.title} — Visual Wishlist`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  }

  const updatedDate = new Date(canvas.updated_at).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayBlocks = migrateCanvasBlocks(canvas.blocks);

  function countProducts(blockList: Block[]): number {
    return blockList.reduce((count, block) => {
      if (block.type === "product") return count + 1;
      if (block.type === "bento") {
        return count + countProducts(block.data.children ?? []);
      }
      return count;
    }, 0);
  }

  const productCount = countProducts(displayBlocks);

  return (
    <div className="min-h-screen bg-stone-50">
      <SiteHeader
        maxWidth="wide"
        actions={
          isDraftPreview ? (
            <span className="text-xs text-stone-400">下書きプレビュー</span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-stone-600"
            >
              <Share2 className="h-4 w-4" />
              シェア
            </Button>
          )
        }
      />

      <main className="px-5 pb-20 pt-10 sm:px-6 sm:pb-28 sm:pt-16">
        <article className="content-column animate-fade-in">
          <header className="mb-12 sm:mb-14">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
              {isDraftPreview ? "Draft Preview" : "Wishlist"}
            </p>
            <h1 className="mt-3 text-[1.75rem] font-bold leading-tight tracking-tight text-stone-900 sm:text-[2.25rem]">
              {canvas.title}
            </h1>
            <p className="mt-4 text-xs text-stone-400">
              {productCount} items
              {!isDraftPreview && <> · Updated {updatedDate}</>}
            </p>
          </header>

          {displayBlocks.length === 0 ? (
            <p className="py-16 text-center text-[15px] text-stone-400">
              コンテンツはまだありません
            </p>
          ) : (
            <div className="document-body">
              <BlockStream blocks={displayBlocks} />
            </div>
          )}
        </article>
      </main>

      <footer className="content-column px-5 py-8 sm:px-0">
        <p className="text-center text-[11px] tracking-wide text-stone-400">
          Visual Wishlist
        </p>
      </footer>
    </div>
  );
}
