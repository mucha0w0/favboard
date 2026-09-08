import type { BentoCellPlacement } from "@/lib/types";
import { BENTO_COLS } from "./constants";
import { clampPlacement } from "./grid";

/** グリッド content 原点基準のピクセル矩形 */
export type PixelRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** ドラッグ換算用のグリッド幾何（pointer 開始時に一度測る） */
export type BentoGridGeometry = {
  cell: number;
  gap: number;
  /** cell + gap — 隣セル原点までの距離 */
  step: number;
  padLeft: number;
  padTop: number;
};

export function measureBentoGridGeometry(gridEl: HTMLElement): BentoGridGeometry {
  const rect = gridEl.getBoundingClientRect();
  const style = getComputedStyle(gridEl);
  const padLeft = parseFloat(style.paddingLeft) || 0;
  const padTop = parseFloat(style.paddingTop) || 0;
  const padRight = parseFloat(style.paddingRight) || 0;
  const gap =
    parseFloat(style.columnGap) ||
    parseFloat(style.rowGap) ||
    parseFloat(style.gap) ||
    0;
  const contentW = Math.max(0, rect.width - padLeft - padRight);
  const cell = (contentW - gap * (BENTO_COLS - 1)) / BENTO_COLS;
  return {
    cell: Math.max(1, cell),
    gap: Math.max(0, gap),
    step: Math.max(1, cell + gap),
    padLeft,
    padTop,
  };
}

/** @deprecated use measureBentoGridGeometry */
export function measureBentoGridMetrics(el: HTMLElement) {
  const g = measureBentoGridGeometry(el);
  return { cellSize: g.cell, gap: g.gap, step: g.step };
}

/** @deprecated use measureBentoGridGeometry */
export function measureBentoGridStepFromDOM(gridEl: HTMLElement) {
  return measureBentoGridMetrics(gridEl);
}

/** placement → content 原点からのピクセル矩形 */
export function placementToPixels(
  placement: BentoCellPlacement,
  geo: BentoGridGeometry,
): PixelRect {
  const { cell, gap, step } = geo;
  return {
    x: placement.col * step,
    y: placement.row * step,
    w: placement.colSpan * cell + (placement.colSpan - 1) * gap,
    h: placement.rowSpan * cell + (placement.rowSpan - 1) * gap,
  };
}

/**
 * ピクセル矩形 → グリッド placement（未 clamp）。
 * 辺をグリッド線に丸め、最低 1×1。負座標やグリッド外もそのまま返す。
 */
export function pixelsToPlacementRaw(
  rect: PixelRect,
  geo: BentoGridGeometry,
): BentoCellPlacement {
  const { step, gap } = geo;
  const col = Math.round(rect.x / step);
  const row = Math.round(rect.y / step);
  const colSpan = Math.max(1, Math.round((rect.w + gap) / step));
  const rowSpan = Math.max(1, Math.round((rect.h + gap) / step));
  return { col, row, colSpan, rowSpan };
}

/**
 * ピクセル矩形 → グリッド placement。
 * 辺をグリッド線に丸め、最低 1×1。グリッド内へ clamp。
 */
export function pixelsToPlacement(
  rect: PixelRect,
  geo: BentoGridGeometry,
  rowCount: number,
): BentoCellPlacement {
  return clampPlacement(pixelsToPlacementRaw(rect, geo), rowCount);
}

/** グリッド content 領域のピクセルサイズ */
export function gridContentSize(
  geo: BentoGridGeometry,
  rowCount: number,
): { width: number; height: number } {
  const { cell, gap } = geo;
  return {
    width: BENTO_COLS * cell + Math.max(0, BENTO_COLS - 1) * gap,
    height: rowCount * cell + Math.max(0, rowCount - 1) * gap,
  };
}

/** 1 セル分の最小サイズを保証 */
export function clampPixelRectSize(
  rect: PixelRect,
  geo: BentoGridGeometry,
): PixelRect {
  const min = geo.cell;
  return {
    x: rect.x,
    y: rect.y,
    w: Math.max(min, rect.w),
    h: Math.max(min, rect.h),
  };
}
