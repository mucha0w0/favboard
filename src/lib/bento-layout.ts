import {
  type BentoCellPlacement,
  type BentoChildType,
  type Block,
  type BlockData,
  type ProductSize,
  isBentoChildType,
} from "@/lib/types";

export const BENTO_COLS = 6;
export const DEFAULT_BENTO_ROWS = 4;
export const MIN_BENTO_ROWS = 2;
export const MAX_BENTO_ROWS = 24;

const DEFAULT_CHILD_SIZE: Record<
  BentoChildType,
  Pick<BentoCellPlacement, "colSpan" | "rowSpan">
> = {
  product: { colSpan: 2, rowSpan: 2 },
  text: { colSpan: 3, rowSpan: 1 },
};

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

function occupies(
  placement: BentoCellPlacement,
  col: number,
  row: number,
): boolean {
  return (
    col >= placement.col &&
    col < placement.col + placement.colSpan &&
    row >= placement.row &&
    row < placement.row + placement.rowSpan
  );
}

function overlaps(a: BentoCellPlacement, b: BentoCellPlacement): boolean {
  return !(
    a.col + a.colSpan <= b.col ||
    b.col + b.colSpan <= a.col ||
    a.row + a.rowSpan <= b.row ||
    b.row + b.rowSpan <= a.row
  );
}

export function getOccupiedCells(
  bento: Block,
  excludeChildId?: string,
): boolean[][] {
  const rows = getBentoRows(bento);
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    Array(BENTO_COLS).fill(false),
  );

  for (const child of getBentoChildren(bento)) {
    if (child.id === excludeChildId) continue;
    const p = getChildPlacement(bento, child.id);
    for (let r = p.row; r < p.row + p.rowSpan; r++) {
      for (let c = p.col; c < p.col + p.colSpan; c++) {
        if (grid[r]?.[c] !== undefined) grid[r][c] = true;
      }
    }
  }

  return grid;
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

export function findEmptyPlacement(
  bento: Block,
  colSpan: number,
  rowSpan: number,
): { placement: BentoCellPlacement; bento: Block } | null {
  let working = bento;

  for (let extraRows = 0; extraRows <= MAX_BENTO_ROWS; extraRows++) {
    if (extraRows > 0) {
      working = setBentoRows(working, getBentoRows(working) + 1);
    }
    const rows = getBentoRows(working);

    for (let row = 0; row <= rows - rowSpan; row++) {
      for (let col = 0; col <= BENTO_COLS - colSpan; col++) {
        const candidate = { col, row, colSpan, rowSpan };
        if (canPlace(working, candidate)) {
          return { placement: candidate, bento: working };
        }
      }
    }
  }

  return null;
}

export function requiredBentoRows(bento: Block): number {
  let maxRow = MIN_BENTO_ROWS;
  for (const child of getBentoChildren(bento)) {
    const p = getChildPlacement(bento, child.id);
    maxRow = Math.max(maxRow, p.row + p.rowSpan);
  }
  return maxRow;
}

export function updateChildPlacement(
  bento: Block,
  childId: string,
  placement: BentoCellPlacement,
): Block {
  const rows = Math.max(
    getBentoRows(bento),
    requiredBentoRows(bento),
    placement.row + placement.rowSpan,
  );
  const next = clampPlacement(placement, rows);
  if (!canPlace(bento, next, childId)) return bento;

  const nextRows = Math.min(
    MAX_BENTO_ROWS,
    Math.max(rows, next.row + next.rowSpan),
  );

  return {
    ...bento,
    data: {
      ...bento.data,
      bento_rows: nextRows,
      child_placements: {
        ...bento.data.child_placements,
        [childId]: next,
      },
    },
  };
}

export function setBentoRows(bento: Block, rows: number): Block {
  const nextRows = Math.max(MIN_BENTO_ROWS, Math.min(MAX_BENTO_ROWS, rows));
  const placements = { ...bento.data.child_placements };

  for (const child of getBentoChildren(bento)) {
    const current = getChildPlacement(bento, child.id);
    placements[child.id] = clampPlacement(current, nextRows);
  }

  return {
    ...bento,
    data: {
      ...bento.data,
      bento_rows: nextRows,
      child_placements: placements,
    },
  };
}

export function addBentoChild(bento: Block, child: Block): Block {
  if (!isBentoChildType(child.type)) return bento;

  const size = DEFAULT_CHILD_SIZE[child.type];
  const found = findEmptyPlacement(bento, size.colSpan, size.rowSpan);
  if (!found) return bento;

  const { placement, bento: working } = found;
  const nextRows = Math.max(getBentoRows(working), placement.row + placement.rowSpan);

  return {
    ...working,
    data: {
      ...working.data,
      bento_rows: nextRows,
      children: [...getBentoChildren(working), child],
      child_placements: {
        ...working.data.child_placements,
        [child.id]: placement,
      },
    },
  };
}

export function removeBentoChild(bento: Block, childId: string): Block {
  const placements = { ...bento.data.child_placements };
  delete placements[childId];

  const next: Block = {
    ...bento,
    data: {
      ...bento.data,
      children: getBentoChildren(bento).filter((c) => c.id !== childId),
      child_placements: placements,
    },
  };

  return setBentoRows(next, Math.max(MIN_BENTO_ROWS, requiredBentoRows(next)));
}

export function updateBentoChildData(
  bento: Block,
  childId: string,
  data: Partial<BlockData>,
): Block {
  return {
    ...bento,
    data: {
      ...bento.data,
      children: getBentoChildren(bento).map((c) =>
        c.id === childId ? { ...c, data: { ...c.data, ...data } } : c,
      ),
    },
  };
}

export function createBentoBlock(): Block {
  return {
    id: crypto.randomUUID(),
    type: "bento",
    data: {
      bento_rows: DEFAULT_BENTO_ROWS,
      children: [],
      child_placements: {},
    },
  };
}

export function createBentoChild(type: BentoChildType): Block {
  return {
    id: crypto.randomUUID(),
    type,
    data:
      type === "text"
        ? { body: "" }
        : { title: "", brand: "", price: "" },
  };
}

/** 旧データ: トップレベルの product/text を Bento に包む */
export function migrateCanvasBlocks(blocks: Block[]): Block[] {
  const result: Block[] = [];
  let legacyBuffer: Block[] = [];

  function flushLegacy() {
    if (legacyBuffer.length === 0) return;
    let bento = createBentoBlock();
    for (const child of legacyBuffer) {
      bento = addBentoChild(bento, child);
    }
    result.push(bento);
    legacyBuffer = [];
  }

  for (const block of blocks) {
    if (block.type === "product" || block.type === "text") {
      legacyBuffer.push(block);
      continue;
    }
    flushLegacy();
    if (block.type === "bento") {
      result.push(normalizeBentoBlock(block));
    } else {
      result.push(block);
    }
  }

  flushLegacy();
  return result;
}

function normalizeBentoBlock(block: Block): Block {
  const rows = Math.max(
    getBentoRows(block),
    requiredBentoRows(block),
  );
  const placements = { ...block.data.child_placements };
  for (const child of getBentoChildren(block)) {
    placements[child.id] = getChildPlacement(
      { ...block, data: { ...block.data, bento_rows: rows } },
      child.id,
    );
  }
  return {
    ...block,
    data: { ...block.data, bento_rows: rows, child_placements: placements },
  };
}

/** グリッド上の占有セル数から商品カードの表示サイズを推定 */
export function getProductSizeFromPlacement(
  colSpan: number,
  rowSpan: number,
): ProductSize {
  const area = colSpan * rowSpan;
  if (area <= 4) return "compact";
  if (area <= 6) return "standard";
  if (area <= 12) return "large";
  return "xl";
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
