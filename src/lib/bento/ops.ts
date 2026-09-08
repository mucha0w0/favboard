import {
  type BentoCellPlacement,
  type BentoChildType,
  type Block,
  type BlockData,
  type TopLevelBlockType,
  isBentoChildType,
} from "@/lib/types";
import {
  BENTO_COLS,
  DEFAULT_BENTO_ROWS,
  DEFAULT_CHILD_SIZE,
  MAX_BENTO_ROWS,
  MIN_BENTO_ROWS,
} from "./constants";
import {
  canPlace,
  clampPlacement,
  getBentoChildren,
  getBentoRows,
  getChildPlacement,
  requiredBentoRows,
} from "./grid";

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

export function updateChildPlacement(
  bento: Block,
  childId: string,
  placement: BentoCellPlacement,
  options?: { expandRows?: boolean },
): Block {
  const expandRows = options?.expandRows ?? true;
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
  const nextRows = Math.max(
    getBentoRows(working),
    placement.row + placement.rowSpan,
  );

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

export function createTopLevelBlock(type: TopLevelBlockType): Block {
  if (type === "bento") return createBentoBlock();
  return {
    id: crypto.randomUUID(),
    type,
    data: type === "heading" ? { text: "" } : {},
  };
}
