import type { BentoCellPlacement, Block } from "@/lib/types";
import {
  BENTO_COLS,
  DEFAULT_BENTO_ROWS,
  LEGACY_BENTO_COLS_6,
  LEGACY_BENTO_COLS_12,
  MAX_BENTO_ROWS,
} from "./constants";
import {
  getBentoChildren,
  getBentoRows,
  getChildPlacement,
  requiredBentoRows,
} from "./grid";
import { addBentoChild, createBentoBlock } from "./ops";

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

function fitsInCols(block: Block, cols: number): boolean {
  const placements = block.data.child_placements ?? {};
  const entries = Object.values(placements);
  if (entries.length === 0) return false;
  return entries.every(
    (p) => p.col + p.colSpan <= cols && p.colSpan <= cols,
  );
}

function scalePlacements(
  placements: Record<string, BentoCellPlacement>,
  factor: number,
): Record<string, BentoCellPlacement> {
  const next = { ...placements };
  for (const [childId, p] of Object.entries(next)) {
    next[childId] = {
      col: p.col * factor,
      row: p.row,
      colSpan: p.colSpan * factor,
      rowSpan: p.rowSpan * factor,
    };
  }
  return next;
}

function scaleLegacyGrid(block: Block, factor: number): Block {
  const migratedRows = Math.min(
    MAX_BENTO_ROWS,
    Math.max(getBentoRows(block), block.data.bento_rows ?? DEFAULT_BENTO_ROWS) *
      factor,
  );
  return {
    ...block,
    data: {
      ...block.data,
      bento_rows: migratedRows,
      child_placements: scalePlacements(
        block.data.child_placements ?? {},
        factor,
      ),
    },
  };
}

/** 未スタンプ時のみヒューリスティック。スタンプ後は bento_cols を信頼する */
function inferLegacyCols(block: Block): number {
  if (fitsInCols(block, LEGACY_BENTO_COLS_6)) return LEGACY_BENTO_COLS_6;
  return LEGACY_BENTO_COLS_12;
}

function normalizeBentoBlock(block: Block): Block {
  let working = block;
  const storedCols = block.data.bento_cols;

  if (storedCols !== BENTO_COLS) {
    const fromCols = storedCols ?? inferLegacyCols(block);
    const factor = BENTO_COLS / fromCols;
    if (factor !== 1 && Number.isInteger(factor) && factor > 1) {
      working = scaleLegacyGrid(block, factor);
    }
  }

  const rows = Math.max(getBentoRows(working), requiredBentoRows(working));
  const placements = { ...working.data.child_placements };
  for (const child of getBentoChildren(working)) {
    const p = getChildPlacement(
      { ...working, data: { ...working.data, bento_rows: rows } },
      child.id,
    );
    placements[child.id] = {
      col: p.col,
      row: p.row,
      colSpan: p.colSpan,
      rowSpan: p.rowSpan,
    };
  }
  return {
    ...working,
    data: {
      ...working.data,
      bento_rows: rows,
      bento_cols: BENTO_COLS,
      child_placements: placements,
    },
  };
}
