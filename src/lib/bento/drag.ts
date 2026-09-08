import type { BentoCellPlacement } from "@/lib/types";
import { BENTO_COLS, MAX_BENTO_ROWS } from "./constants";
import {
  type BentoGridGeometry,
  type PixelRect,
  clampPixelRectSize,
  gridContentSize,
  pixelsToPlacement,
  pixelsToPlacementRaw,
} from "./dom";
import { clampPlacement } from "./grid";

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

function edgeAxes(edge: ResizeEdge) {
  return {
    affectsRight: edge === "right" || edge === "se" || edge === "ne",
    affectsLeft: edge === "left" || edge === "sw" || edge === "nw",
    affectsBottom: edge === "bottom" || edge === "se" || edge === "sw",
    affectsTop: edge === "top" || edge === "ne" || edge === "nw",
  };
}

/**
 * リサイズ時の壁 clamp。ドラッグしていない辺は開始位置で固定し、
 * 壁に当たったらそこで拡大を止める（反対側へ伸ばさない）。
 */
export function clampResizePlacement(
  placement: BentoCellPlacement,
  rowCount: number,
  edge: ResizeEdge,
  start: BentoCellPlacement,
): BentoCellPlacement {
  const { affectsRight, affectsLeft, affectsBottom, affectsTop } =
    edgeAxes(edge);

  let col: number;
  let colSpan: number;
  let row: number;
  let rowSpan: number;

  if (affectsLeft && !affectsRight) {
    const right = start.col + start.colSpan;
    col = Math.max(0, Math.min(placement.col, right - 1));
    colSpan = right - col;
  } else if (affectsRight && !affectsLeft) {
    col = start.col;
    colSpan = Math.max(1, Math.min(placement.colSpan, BENTO_COLS - col));
  } else {
    col = start.col;
    colSpan = start.colSpan;
  }

  if (affectsTop && !affectsBottom) {
    const bottom = start.row + start.rowSpan;
    row = Math.max(0, Math.min(placement.row, bottom - 1));
    rowSpan = bottom - row;
  } else if (affectsBottom && !affectsTop) {
    row = start.row;
    rowSpan = Math.max(1, Math.min(placement.rowSpan, rowCount - row));
  } else {
    row = start.row;
    rowSpan = start.rowSpan;
  }

  return { col, row, colSpan, rowSpan };
}

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
    const { width: maxW, height: maxH } = gridContentSize(
      geo,
      origin.startRows,
    );
    const x = Math.max(0, Math.min(maxW - startRect.w, startRect.x + dx));
    const y = Math.max(0, Math.min(maxH - startRect.h, startRect.y + dy));
    return { x, y, w: startRect.w, h: startRect.h };
  }

  if (mode.kind !== "resize") {
    return startRect;
  }

  const { affectsRight, affectsLeft, affectsBottom, affectsTop } = edgeAxes(
    mode.edge,
  );
  // 子の移動・リサイズでは Bento 行数を増やさない。下端は壁として扱う。
  const { width: maxW, height: maxH } = gridContentSize(
    geo,
    origin.startRows,
  );

  let { x, y, w, h } = startRect;
  const right = x + w;
  const bottom = y + h;

  if (affectsRight) {
    w = Math.max(min, Math.min(maxW - x, startRect.w + dx));
  }
  if (affectsLeft) {
    const nextX = startRect.x + dx;
    const maxX = right - min;
    x = Math.max(0, Math.min(nextX, maxX));
    w = right - x;
  }
  if (affectsBottom) {
    h = Math.max(min, Math.min(maxH - y, startRect.h + dy));
  }
  if (affectsTop) {
    const nextY = startRect.y + dy;
    const maxY = bottom - min;
    y = Math.max(0, Math.min(nextY, maxY));
    h = bottom - y;
  }

  return clampPixelRectSize({ x, y, w, h }, geo);
}

/**
 * フロート矩形をスナップした placement に変換。
 * expandRows 時のみ下方向にはみ出した分で行数を拡張する。
 * resizeEdge 指定時は壁側で拡大を止め、反対辺を動かさない。
 */
export function snapFloatToPlacement(
  float: PixelRect,
  geo: BentoGridGeometry,
  currentRows: number,
  options?: {
    expandRows?: boolean;
    resizeEdge?: ResizeEdge;
    startPlacement?: BentoCellPlacement;
  },
): { placement: BentoCellPlacement; bentoRows: number } {
  const expandRows = options?.expandRows ?? true;
  const resizeEdge = options?.resizeEdge;
  const startPlacement = options?.startPlacement;

  // 仮の大きな rowCount でスナップしてから行数を決める
  const provisionalRows = expandRows ? MAX_BENTO_ROWS : currentRows;
  const raw = pixelsToPlacementRaw(float, geo);

  const provisional =
    resizeEdge && startPlacement
      ? clampResizePlacement(raw, provisionalRows, resizeEdge, startPlacement)
      : pixelsToPlacement(float, geo, provisionalRows);

  const neededRows = provisional.row + provisional.rowSpan;
  const bentoRows = expandRows
    ? Math.min(MAX_BENTO_ROWS, Math.max(currentRows, neededRows))
    : currentRows;

  if (resizeEdge && startPlacement) {
    return {
      placement: clampResizePlacement(
        raw,
        bentoRows,
        resizeEdge,
        startPlacement,
      ),
      bentoRows,
    };
  }

  const placement = clampPlacement(raw, bentoRows);

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
