import type { BentoCellPlacement } from "@/lib/types";
import { BENTO_COLS, MAX_BENTO_ROWS } from "./constants";
import {
  type BentoGridGeometry,
  type PixelRect,
  clampPixelRectSize,
  pixelsToPlacement,
} from "./dom";

export type ResizeEdge =
  | "right"
  | "bottom"
  | "left"
  | "top"
  | "se"
  | "sw"
  | "ne"
  | "nw";

export type DragMode =
  | { kind: "move"; childId: string }
  | { kind: "resize"; childId: string; edge: ResizeEdge }
  | { kind: "bento-height" };

export type DragOrigin = {
  pointerX: number;
  pointerY: number;
  startRect: PixelRect;
  startPlacement: BentoCellPlacement;
  geo: BentoGridGeometry;
  startRows: number;
};

/** ポインタ差分からフロート矩形を計算（カーソルに 1:1 追従） */
export function computeFloatRect(
  mode: DragMode,
  origin: DragOrigin,
  clientX: number,
  clientY: number,
): PixelRect {
  const dx = clientX - origin.pointerX;
  const dy = clientY - origin.pointerY;
  const { startRect, geo } = origin;
  const min = geo.cell;

  if (mode.kind === "move") {
    return {
      x: startRect.x + dx,
      y: startRect.y + dy,
      w: startRect.w,
      h: startRect.h,
    };
  }

  if (mode.kind !== "resize") {
    return startRect;
  }

  const edge = mode.edge;
  const affectsRight = edge === "right" || edge === "se" || edge === "ne";
  const affectsLeft = edge === "left" || edge === "sw" || edge === "nw";
  const affectsBottom = edge === "bottom" || edge === "se" || edge === "sw";
  const affectsTop = edge === "top" || edge === "ne" || edge === "nw";

  let { x, y, w, h } = startRect;
  const right = x + w;
  const bottom = y + h;

  if (affectsRight) {
    w = Math.max(min, startRect.w + dx);
  }
  if (affectsLeft) {
    const nextX = startRect.x + dx;
    const maxX = right - min;
    x = Math.min(nextX, maxX);
    w = right - x;
  }
  if (affectsBottom) {
    h = Math.max(min, startRect.h + dy);
  }
  if (affectsTop) {
    const nextY = startRect.y + dy;
    const maxY = bottom - min;
    y = Math.min(nextY, maxY);
    h = bottom - y;
  }

  return clampPixelRectSize({ x, y, w, h }, geo);
}

/**
 * フロート矩形をスナップした placement に変換。
 * 下方向リサイズ時は必要に応じて行数を拡張した仮想 rowCount で clamp。
 */
export function snapFloatToPlacement(
  float: PixelRect,
  geo: BentoGridGeometry,
  currentRows: number,
  options?: { expandRows?: boolean },
): { placement: BentoCellPlacement; bentoRows: number } {
  const expandRows = options?.expandRows ?? true;

  // 仮の大きな rowCount でスナップしてから行数を決める
  const provisionalRows = expandRows ? MAX_BENTO_ROWS : currentRows;
  const raw = pixelsToPlacement(float, geo, provisionalRows);

  const neededRows = raw.row + raw.rowSpan;
  const bentoRows = expandRows
    ? Math.min(MAX_BENTO_ROWS, Math.max(currentRows, neededRows))
    : currentRows;

  const placement = pixelsToPlacement(float, geo, bentoRows);

  // 列は常にグリッド内へ
  const colSpan = Math.max(1, Math.min(BENTO_COLS, placement.colSpan));
  const col = Math.max(0, Math.min(BENTO_COLS - colSpan, placement.col));

  return {
    placement: { ...placement, col, colSpan },
    bentoRows,
  };
}

/** 高さグリップ用: 行数デルタ */
export function rowsFromPointerDelta(
  dy: number,
  step: number,
  startRows: number,
  minRows: number,
): number {
  if (step <= 0) return startRows;
  const delta = Math.round(dy / step);
  return Math.max(minRows, Math.min(MAX_BENTO_ROWS, startRows + delta));
}
