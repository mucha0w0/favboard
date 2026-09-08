import type { BentoCellPlacement } from "@/lib/types";
import { BENTO_COLS } from "./constants";
import { deltaGridUnits } from "./grid";

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
  | { kind: "move"; childId: string; startCol: number; startRow: number }
  | { kind: "resize"; childId: string; edge: ResizeEdge }
  | { kind: "bento-height" };

export type DragOrigin = {
  x: number;
  y: number;
  placement: BentoCellPlacement;
  step: number;
};

export function computePlacementFromDrag(
  mode: DragMode,
  origin: DragOrigin,
  dx: number,
  dy: number,
  rowCount: number,
): { childId: string; placement: BentoCellPlacement } | null {
  const { step, placement: startP } = origin;
  const deltaCol = deltaGridUnits(dx, step);
  const deltaRow = deltaGridUnits(dy, step);

  if (mode.kind === "move") {
    return {
      childId: mode.childId,
      placement: {
        ...startP,
        col: mode.startCol + deltaCol,
        row: mode.startRow + deltaRow,
      },
    };
  }

  if (mode.kind === "resize") {
    const edge = mode.edge;
    let col = startP.col;
    let row = startP.row;
    let colSpan = startP.colSpan;
    let rowSpan = startP.rowSpan;

    const affectsRight = edge === "right" || edge === "se" || edge === "ne";
    const affectsLeft = edge === "left" || edge === "sw" || edge === "nw";
    const affectsBottom =
      edge === "bottom" || edge === "se" || edge === "sw";
    const affectsTop = edge === "top" || edge === "ne" || edge === "nw";

    if (affectsRight) {
      colSpan = Math.max(
        1,
        Math.min(BENTO_COLS - startP.col, startP.colSpan + deltaCol),
      );
    }
    if (affectsLeft) {
      col = Math.max(
        0,
        Math.min(startP.col + startP.colSpan - 1, startP.col + deltaCol),
      );
      colSpan = startP.col + startP.colSpan - col;
      colSpan = Math.max(1, Math.min(BENTO_COLS - col, colSpan));
    }
    if (affectsBottom) {
      rowSpan = Math.max(
        1,
        Math.min(rowCount - startP.row, startP.rowSpan + deltaRow),
      );
    }
    if (affectsTop) {
      row = Math.max(
        0,
        Math.min(startP.row + startP.rowSpan - 1, startP.row + deltaRow),
      );
      rowSpan = startP.row + startP.rowSpan - row;
      rowSpan = Math.max(1, Math.min(rowCount - row, rowSpan));
    }

    return {
      childId: mode.childId,
      placement: { col, row, colSpan, rowSpan },
    };
  }

  return null;
}
