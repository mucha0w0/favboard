import {
  type BentoCellPlacement,
  type BentoChildType,
  type Block,
  type BlockData,
  type ProductSize,
  isBentoChildType,
} from "@/lib/types";

export const BENTO_COLS = 12;
export const DEFAULT_BENTO_ROWS = 6;
export const MIN_BENTO_ROWS = 2;
export const MAX_BENTO_ROWS = 48;

const LEGACY_BENTO_COLS = 6;

const DEFAULT_CHILD_SIZE: Record<
  BentoChildType,
  Pick<BentoCellPlacement, "colSpan" | "rowSpan">
> = {
  product: { colSpan: 2, rowSpan: 2 },
  text: { colSpan: 6, rowSpan: 1 },
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
  options?: { expandRows?: boolean },
): Block {
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

  const workingBento: Block = {
    ...bento,
    data: { ...bento.data, bento_rows: nextRows },
  };

  const next = clampPlacement(placement, nextRows);
  if (!canPlace(workingBento, next, childId)) return bento;

  return {
    ...workingBento,
    data: {
      ...workingBento.data,
      bento_rows: expandRows ? nextRows : currentRows,
      child_placements: {
        ...workingBento.data.child_placements,
        [childId]: next,
      },
    },
  };
}

export function setBentoRows(bento: Block, rows: number): Block {
  const required = requiredBentoRows(bento);
  const nextRows = Math.max(
    MIN_BENTO_ROWS,
    required,
    Math.min(MAX_BENTO_ROWS, rows),
  );
  const placements = { ...bento.data.child_placements };

  for (const child of getBentoChildren(bento)) {
    const current = getChildPlacement(bento, child.id);
    const rowSpan = Math.min(current.rowSpan, nextRows);
    const row = Math.max(0, Math.min(nextRows - rowSpan, current.row));
    placements[child.id] = clampPlacement(
      { ...current, row, rowSpan },
      nextRows,
    );
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

function isLegacy6ColGrid(block: Block): boolean {
  const placements = block.data.child_placements ?? {};
  const entries = Object.values(placements);
  if (entries.length === 0) return false;
  return entries.every(
    (p) => p.col + p.colSpan <= LEGACY_BENTO_COLS && p.colSpan <= LEGACY_BENTO_COLS,
  );
}

function migrateLegacy6ColPlacements(
  block: Block,
): Record<string, BentoCellPlacement> {
  const placements = { ...block.data.child_placements };
  for (const [childId, p] of Object.entries(placements)) {
    const { sizeRowSpan: _legacy, ...rest } = p;
    placements[childId] = {
      col: rest.col * 2,
      row: rest.row,
      colSpan: rest.colSpan * 2,
      rowSpan: rest.rowSpan * 2,
    };
  }
  return placements;
}

function normalizeBentoBlock(block: Block): Block {
  let working = block;
  if (isLegacy6ColGrid(block)) {
    const migratedRows = Math.min(
      MAX_BENTO_ROWS,
      Math.max(getBentoRows(block), block.data.bento_rows ?? DEFAULT_BENTO_ROWS) * 2,
    );
    working = {
      ...block,
      data: {
        ...block.data,
        bento_rows: migratedRows,
        child_placements: migrateLegacy6ColPlacements(block),
      },
    };
  }

  const rows = Math.max(getBentoRows(working), requiredBentoRows(working));
  const placements = { ...working.data.child_placements };
  for (const child of getBentoChildren(working)) {
    const p = getChildPlacement(
      { ...working, data: { ...working.data, bento_rows: rows } },
      child.id,
    );
    const { sizeRowSpan: _legacy, ...rest } = p;
    placements[child.id] = rest;
  }
  return {
    ...working,
    data: { ...working.data, bento_rows: rows, child_placements: placements },
  };
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

/** コンテナ幅から 1 セルの辺長（px）を算出 — ドラッグのスナップ用 */
export function measureBentoCellSize(el: HTMLElement): number {
  return measureBentoGridMetrics(el).cellSize;
}

/** グリッドのセル辺長と gap（px）— ドラッグ換算用 */
export function measureBentoGridMetrics(el: HTMLElement): {
  cellSize: number;
  gap: number;
  step: number;
} {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const gap =
    parseFloat(style.columnGap) || parseFloat(style.gap) || 0;
  const padX =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const contentW = rect.width - padX;
  const cellSize = (contentW - gap * (BENTO_COLS - 1)) / BENTO_COLS;
  return { cellSize, gap, step: cellSize + gap };
}

/** 描画済みセルから実測のステップ幅を取得（計算値より優先） */
export function measureBentoGridStepFromDOM(
  gridEl: HTMLElement,
): { cellSize: number; gap: number; step: number } {
  const fallback = measureBentoGridMetrics(gridEl);
  const cells = gridEl.querySelectorAll(":scope > *");
  if (cells.length < 2) return fallback;

  const first = cells[0].getBoundingClientRect();
  const second = cells[1].getBoundingClientRect();
  const step = second.left - first.left;
  const cellSize = first.width;
  const gap = step - cellSize;

  if (step <= 0 || cellSize <= 0) return fallback;
  return { cellSize, gap, step };
}

/** ピクセル移動量をグリッド単位に換算（セル + gap を 1 ステップとする） */
export function deltaGridUnits(
  deltaPx: number,
  step: number,
): number {
  if (step <= 0) return 0;
  return Math.round(deltaPx / step);
}
