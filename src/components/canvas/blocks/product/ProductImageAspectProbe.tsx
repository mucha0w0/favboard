"use client";

import { getProductSizeFromPlacement } from "@/lib/bento";
import { useEffect, useRef } from "react";
import { GRID_SIZE_STYLES, shouldUseVerticalLayout } from "./styles";

/** Bento セル幅の代表値 — 比率だけが重要なので固定 */
const PROBE_CELL_WIDTH = 288;

function getProductPadding(area: number): string {
  if (area <= 16) return "p-1";
  if (area <= 36) return "p-1.5";
  return "p-2";
}

function MetaPlaceholder({
  titleClass,
  lineClamp,
}: {
  titleClass: string;
  lineClamp?: number;
}) {
  const clampClass =
    lineClamp === 2 ? "line-clamp-2" : lineClamp === 3 ? "line-clamp-3" : "";

  return (
    <div className="space-y-1">
      <p className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-stone-300">
        ブランド名
      </p>
      <h3
        className={`font-medium tracking-tight ${titleClass} ${clampClass} text-stone-300`}
      >
        商品名
      </h3>
      <p className="text-xs tabular-nums text-stone-300">¥ —</p>
    </div>
  );
}

/** 商品カードと同じ DOM 構造で画像枠の縦横比を実測する */
export function ProductImageAspectProbe({
  cellSpan,
  onAspectChange,
}: {
  cellSpan: { colSpan: number; rowSpan: number };
  onAspectChange: (aspect: number) => void;
}) {
  const imageRef = useRef<HTMLDivElement>(null);
  const productSize = getProductSizeFromPlacement(
    cellSpan.colSpan,
    cellSpan.rowSpan,
  );
  const useVertical = shouldUseVerticalLayout("grid", productSize, cellSpan);
  const gridStyles = GRID_SIZE_STYLES[productSize];
  const imageClass = useVertical
    ? gridStyles.imageClass
    : gridStyles.horizontalImageClass;
  const area = cellSpan.colSpan * cellSpan.rowSpan;
  const pad = getProductPadding(area);

  useEffect(() => {
    const el = imageRef.current;
    if (!el) return;

    const report = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        onAspectChange(width / height);
      }
    };

    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [
    onAspectChange,
    cellSpan.colSpan,
    cellSpan.rowSpan,
    imageClass,
    pad,
    useVertical,
    gridStyles.gapClass,
    gridStyles.titleClass,
    gridStyles.lineClamp,
  ]);

  return (
    <div
      className="pointer-events-none fixed -left-[9999px] top-0 -z-50 opacity-0"
      aria-hidden
      style={{
        width: PROBE_CELL_WIDTH,
        aspectRatio: `${cellSpan.colSpan} / ${cellSpan.rowSpan}`,
      }}
    >
      <div className={`flex h-full min-h-0 flex-col overflow-hidden ${pad}`}>
        {useVertical ? (
          <div className="flex h-full min-h-0 flex-col gap-1.5">
            <div
              ref={imageRef}
              className={`relative min-h-0 w-full overflow-hidden bg-stone-100 ${imageClass}`}
            />
            <div className="shrink-0">
              <MetaPlaceholder
                titleClass={gridStyles.titleClass}
                lineClamp={gridStyles.lineClamp}
              />
            </div>
          </div>
        ) : (
          <div
            className={`flex h-full min-h-0 items-center ${gridStyles.gapClass ?? "gap-2"}`}
          >
            <div
              ref={imageRef}
              className={`relative shrink-0 overflow-hidden bg-stone-100 ${imageClass}`}
            />
            <div className="min-h-0 min-w-0 flex-1">
              <MetaPlaceholder
                titleClass={gridStyles.titleClass}
                lineClamp={gridStyles.lineClamp}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
