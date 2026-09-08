import type { BentoCellPlacement, Block } from "@/lib/types";
import {
  DEFAULT_BENTO_ROWS,
  LEGACY_BENTO_COLS,
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

function isLegacy6ColGrid(block: Block): boolean {
  const placements = block.data.child_placements ?? {};
  const entries = Object.values(placements);
  if (entries.length === 0) return false;
  return entries.every(
    (p) =>
      p.col + p.colSpan <= LEGACY_BENTO_COLS &&
      p.colSpan <= LEGACY_BENTO_COLS,
  );
}

function migrateLegacy6ColPlacements(
  block: Block,
): Record<string, BentoCellPlacement> {
  const placements = { ...block.data.child_placements };
  for (const [childId, p] of Object.entries(placements)) {
    placements[childId] = {
      col: p.col * 2,
      row: p.row,
      colSpan: p.colSpan * 2,
      rowSpan: p.rowSpan * 2,
    };
  }
  return placements;
}

function normalizeBentoBlock(block: Block): Block {
  let working = block;
  if (isLegacy6ColGrid(block)) {
    const migratedRows = Math.min(
      MAX_BENTO_ROWS,
      Math.max(getBentoRows(block), block.data.bento_rows ?? DEFAULT_BENTO_ROWS) *
        2,
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
    placements[child.id] = {
      col: p.col,
      row: p.row,
      colSpan: p.colSpan,
      rowSpan: p.rowSpan,
    };
  }
  return {
    ...working,
    data: { ...working.data, bento_rows: rows, child_placements: placements },
  };
}
