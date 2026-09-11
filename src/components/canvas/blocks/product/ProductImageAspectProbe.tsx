"use client";

import type { Block } from "@/lib/types";
import { useEffect, useRef } from "react";
import { ProductBlock } from "../ProductBlock";

/** Bento セル幅の代表値 — 比率だけが重要なので固定 */
const PROBE_CELL_WIDTH = 288;

function getProductPadding(area: number): string {
  if (area <= 16) return "p-1";
  if (area <= 36) return "p-1.5";
  return "p-2";
}

/** 編集モードの Bento 商品カードと同じ DOM で画像枠の縦横比を実測する */
export function ProductImageAspectProbe({
  block,
  cellSpan,
  onAspectChange,
}: {
  block: Block;
  cellSpan: { colSpan: number; rowSpan: number };
  onAspectChange: (aspect: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const area = cellSpan.colSpan * cellSpan.rowSpan;
  const pad = getProductPadding(area);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const report = () => {
      const imageEl = host.querySelector<HTMLElement>("[data-product-image]");
      if (!imageEl) return;
      const { width, height } = imageEl.getBoundingClientRect();
      if (width > 0 && height > 0) {
        onAspectChange(width / height);
      }
    };

    report();
    const observer = new ResizeObserver(report);
    observer.observe(host);
    return () => observer.disconnect();
  }, [
    onAspectChange,
    block.id,
    block.data.title,
    block.data.brand,
    block.data.image_url,
    cellSpan.colSpan,
    cellSpan.rowSpan,
    pad,
  ]);

  return (
    <div
      ref={hostRef}
      className="pointer-events-none fixed -left-[9999px] top-0 -z-50 opacity-0"
      aria-hidden
      style={{
        width: PROBE_CELL_WIDTH,
        aspectRatio: `${cellSpan.colSpan} / ${cellSpan.rowSpan}`,
      }}
    >
      <div className={`flex h-full min-h-0 flex-col overflow-hidden ${pad}`}>
        <div className="h-full w-full text-left">
          <ProductBlock
            block={block}
            showPlaceholders
            layout="grid"
            cellSpan={cellSpan}
            emphasizeImage={false}
          />
        </div>
      </div>
    </div>
  );
}
