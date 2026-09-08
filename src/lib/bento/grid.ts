import type {
  BentoCellPlacement,
  BentoChildType,
  Block,
  ProductSize,
} from "@/lib/types";
import {
  BENTO_COLS,
  DEFAULT_BENTO_ROWS,
  DEFAULT_CHILD_SIZE,
  MAX_BENTO_ROWS,
  MIN_BENTO_ROWS,
} from "./constants";

export function getBentoRows(block: Block): number {
  if (block.type !== "bento") return DEFAULT_BENTO_ROWS;
  return Math.max(
    MIN_BENTO_ROWS,
    Math.min(MAX_BENTO_ROWS, block.data.bento_rows ?? DEFAULT_BENTO_ROWS),
  );
}

export function getBentoChildren(block: Block): Block[] {
  return block.type === "bento" ? (block.data.children ?? []) : [];
}

export function clampPlacement(
  placement: BentoCellPlacement,
  rowCount: number,
): BentoCellPlacement {
  const colSpan = Math.max(1, Math.min(BENTO_COLS, placement.colSpan));
  const rowSpan = Math.max(1, Math.min(rowCount, placement.rowSpan));
  const col = Math.max(0, Math.min(BENTO_COLS - colSpan, placement.col));
  const row = Math.max(0, Math.min(rowCount - rowSpan, placement.row));
  return { col, row, colSpan, rowSpan };
}

export function overlaps(a: BentoCellPlacement, b: BentoCellPlacement): boolean {
  return !(
    a.col + a.colSpan <= b.col ||
    b.col + b.colSpan <= a.col ||
    a.row + a.rowSpan <= b.row ||
    b.row + b.rowSpan <= a.row
  );
}

export function getChildPlacement(
  bento: Block,
  childId: string,
): BentoCellPlacement {
  const stored = bento.data.child_placements?.[childId];
  if (stored) return clampPlacement(stored, getBentoRows(bento));

  const child = getBentoChildren(bento).find((c) => c.id === childId);
  const defaults = child
    ? DEFAULT_CHILD_SIZE[child.type as BentoChildType]
    : DEFAULT_CHILD_SIZE.product;

  return clampPlacement(
    { col: 0, row: 0, colSpan: defaults.colSpan, rowSpan: defaults.rowSpan },
    getBentoRows(bento),
  );
}

export function canPlace(
  bento: Block,
  placement: BentoCellPlacement,
  excludeChildId?: string,
): boolean {
  const rows = getBentoRows(bento);
  const p = clampPlacement(placement, rows);

  for (const child of getBentoChildren(bento)) {
    if (child.id === excludeChildId) continue;
    if (overlaps(p, getChildPlacement(bento, child.id))) return false;
  }

  return true;
}

export function requiredBentoRows(bento: Block): number {
  let maxRow = MIN_BENTO_ROWS;
  for (const child of getBentoChildren(bento)) {
    const p = getChildPlacement(bento, child.id);
    maxRow = Math.max(maxRow, p.row + p.rowSpan);
  }
  return maxRow;
}

/** グリッド上の占有セル数から商品カードの表示サイズを推定 */
export function getProductSizeFromPlacement(
  colSpan: number,
  rowSpan: number,
): ProductSize {
  const area = colSpan * rowSpan;
  const maxDim = Math.max(colSpan, rowSpan);
  if (area <= 4 || maxDim <= 2) return "compact";
  if (area <= 9 || maxDim <= 3) return "standard";
  if (area <= 20 || maxDim <= 5) return "large";
  return "xl";
}

/** ドラッグ中プレビュー用 — 衝突時は clamp のみ返す */
export function previewChildPlacement(
  bento: Block,
  childId: string,
  placement: BentoCellPlacement,
  options?: { expandRows?: boolean },
): { placement: BentoCellPlacement; bentoRows: number; blocked: boolean } {
  const expandRows = options?.expandRows ?? false;
  const currentRows = getBentoRows(bento);

  const nextRows = expandRows
    ? Math.min(
        MAX_BENTO_ROWS,
        Math.max(
          currentRows,
          requiredBentoRows(bento),
          placement.row + placement.rowSpan,
        ),
      )
    : currentRows;

  const clamped = clampPlacement(placement, nextRows);
  const workingBento: Block = {
    ...bento,
    data: { ...bento.data, bento_rows: nextRows },
  };

  if (canPlace(workingBento, clamped, childId)) {
    return { placement: clamped, bentoRows: nextRows, blocked: false };
  }

  return { placement: clamped, bentoRows: currentRows, blocked: true };
}

export function placementStyle(placement: BentoCellPlacement): {
  gridColumn: string;
  gridRow: string;
} {
  return {
    gridColumn: `${placement.col + 1} / span ${placement.colSpan}`,
    gridRow: `${placement.row + 1} / span ${placement.rowSpan}`,
  };
}

/** 固定セルサイズの Bento グリッド用 CSS */
export function bentoGridStyle(rowCount: number): {
  gridTemplateColumns: string;
  gridTemplateRows: string;
} {
  return {
    gridTemplateColumns: `repeat(${BENTO_COLS}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rowCount}, var(--bento-cell-size))`,
  };
}

/** ピクセル移動量をグリッド単位に換算（セル + gap を 1 ステップとする） */
export function deltaGridUnits(deltaPx: number, step: number): number {
  if (step <= 0) return 0;
  return Math.round(deltaPx / step);
}
