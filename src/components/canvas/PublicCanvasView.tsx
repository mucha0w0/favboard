"use client";

import { BlockStream } from "@/components/canvas/BlockStream";
import { Button } from "@/components/ui/button";
import { type Canvas } from "@/lib/types";
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

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-30 bg-stone-50/80 backdrop-blur-md">
        <div className="content-column flex items-center justify-between px-4 py-3 sm:px-0">
          <span className="text-xs text-stone-400">
            {isDraftPreview ? "下書きプレビュー" : "Visual Wishlist"}
          </span>
          {!isDraftPreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-stone-600"
            >
              <Share2 className="h-4 w-4" />
              シェア
            </Button>
          )}
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6">
        <article className="content-column py-6 sm:py-10">
          <h1 className="mb-10 text-[1.75rem] font-bold leading-tight text-stone-900 sm:text-[2rem]">
            {canvas.title}
          </h1>

          {canvas.blocks.length === 0 ? (
            <p className="py-12 text-[15px] text-stone-400">
              コンテンツはまだありません
            </p>
          ) : (
            <BlockStream blocks={canvas.blocks} />
          )}
        </article>
      </main>
    </div>
  );
}
