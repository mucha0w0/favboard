import {
  type Block,
  type GridSegmentSize,
  canPairTogether,
  getGridBlockKind,
  getGridMaxColumnsForKind,
  getPairLayout,
  getProductSize,
  isGridBlock,
} from "@/lib/types";

export type ProductPairLayout = "row" | "stack";

export type BlockSegment =
  | { type: "single"; block: Block; index: number }
  | {
      type: "grid-row";
      blocks: Block[];
      size: GridSegmentSize;
      startIndex: number;
      /** 2件ペアの横並び / 3件以上の自動グリッド */
      mode: "pair" | "auto";
    };

export function isRowPair(first: Block, second: Block | undefined): boolean {
  if (!second || !canPairTogether(first, second)) return false;
  return getPairLayout(first) === "row";
}

function sameKindTriple(
  first: Block,
  middle: Block,
  last: Block,
): boolean {
  const a = getGridBlockKind(first);
  const b = getGridBlockKind(middle);
  const c = getGridBlockKind(last);
  return a !== null && a === b && b === c;
}

/** ちょうど2件のペアとして横/縦を切り替えられる位置か */
export function isExactGridPairAt(blocks: Block[], firstIndex: number): boolean {
  const first = blocks[firstIndex];
  const second = blocks[firstIndex + 1];
  if (!second || !canPairTogether(first, second)) return false;

  const before = firstIndex > 0 ? blocks[firstIndex - 1] : undefined;
  const after =
    firstIndex + 2 < blocks.length ? blocks[firstIndex + 2] : undefined;

  if (
    before &&
    canPairTogether(before, first) &&
    sameKindTriple(before, first, second)
  ) {
    return false;
  }

  if (
    after &&
    canPairTogether(second, after) &&
    sameKindTriple(first, second, after)
  ) {
    return false;
  }

  return true;
}

function getPairSegmentSize(first: Block, second: Block): GridSegmentSize {
  const a = getGridBlockKind(first)!;
  const b = getGridBlockKind(second)!;
  if (a === b) return a;
  return a === "text" ? b : a;
}

function productGridSizeForBlock(
  block: Block,
): "compact" | "standard" | undefined {
  if (block.type !== "product") return undefined;
  const size = getProductSize(block);
  if (size === "compact" || size === "standard") return size;
  return undefined;
}

function segmentGridRun(
  run: Block[],
  runStart: number,
  kind: GridSegmentSize,
): BlockSegment[] {
  const segments: BlockSegment[] = [];
  let i = 0;
  let absIndex = runStart;

  while (i < run.length) {
    const block = run[i];
    const next = run[i + 1];

    if (next && isRowPair(block, next)) {
      segments.push({
        type: "grid-row",
        blocks: [block, next],
        size: kind,
        startIndex: absIndex,
        mode: "pair",
      });
      i += 2;
      absIndex += 2;
      continue;
    }

    const maxCols = getGridMaxColumnsForKind(kind);
    const rowBlocks: Block[] = [block];
    let j = i + 1;

    while (j < run.length && rowBlocks.length < maxCols) {
      if (isRowPair(run[j], run[j + 1])) break;
      rowBlocks.push(run[j]);
      j++;
    }

    if (rowBlocks.length === 1) {
      segments.push({ type: "single", block: rowBlocks[0], index: absIndex });
      absIndex += 1;
    } else if (rowBlocks.length === 2 && !isRowPair(rowBlocks[0], rowBlocks[1])) {
      segments.push({ type: "single", block: rowBlocks[0], index: absIndex });
      absIndex += 1;
      segments.push({ type: "single", block: rowBlocks[1], index: absIndex });
      absIndex += 1;
    } else {
      segments.push({
        type: "grid-row",
        blocks: rowBlocks,
        size: kind,
        startIndex: absIndex,
        mode: rowBlocks.length === 2 ? "pair" : "auto",
      });
      absIndex += rowBlocks.length;
    }

    i += rowBlocks.length;
  }

  return segments;
}

export function segmentBlocks(blocks: Block[]): BlockSegment[] {
  const segments: BlockSegment[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (!isGridBlock(block)) {
      segments.push({ type: "single", block, index: i });
      i++;
      continue;
    }

    const next = blocks[i + 1];

    if (next && isRowPair(block, next)) {
      segments.push({
        type: "grid-row",
        blocks: [block, next],
        size: getPairSegmentSize(block, next),
        startIndex: i,
        mode: "pair",
      });
      i += 2;
      continue;
    }

    const kind = getGridBlockKind(block)!;

    if (next && getGridBlockKind(next) === kind) {
      const runStart = i;
      const run: Block[] = [];
      while (i < blocks.length && getGridBlockKind(blocks[i]) === kind) {
        run.push(blocks[i]);
        i++;
      }
      segments.push(...segmentGridRun(run, runStart, kind));
      continue;
    }

    segments.push({ type: "single", block, index: i });
    i++;
  }

  return segments;
}

export function gridColumnClass(
  count: number,
  size: GridSegmentSize,
): string {
  if (count <= 1) return "grid-cols-1";
  if (size === "compact" && count >= 3) return "grid-cols-3";
  return "grid-cols-2";
}

export type BlockDisplayLayout = {
  inGrid: boolean;
  gridSize?: "compact" | "standard";
  colClass: string;
};

/** フラットグリッド上での各ブロックの表示レイアウト（6列ベース） */
export function getBlockDisplayLayout(
  blocks: Block[],
  index: number,
): BlockDisplayLayout {
  for (const segment of segmentBlocks(blocks)) {
    if (segment.type === "single" && segment.index === index) {
      return { inGrid: false, colClass: "col-span-full" };
    }

    if (segment.type === "grid-row") {
      const rowIndex = index - segment.startIndex;
      if (rowIndex < 0 || rowIndex >= segment.blocks.length) continue;

      const count = segment.blocks.length;
      const block = blocks[index];
      const gridSize = productGridSizeForBlock(block);

      if (count === 3 && segment.size === "compact") {
        return {
          inGrid: true,
          gridSize,
          colClass: "col-span-2",
        };
      }
      if (count === 2) {
        return {
          inGrid: true,
          gridSize,
          colClass: "col-span-3",
        };
      }
      return {
        inGrid: true,
        gridSize,
        colClass: "col-span-full",
      };
    }
  }

  return { inGrid: false, colClass: "col-span-full" };
}

export function isSegmentStart(blocks: Block[], index: number): boolean {
  if (index === 0) return true;

  for (const segment of segmentBlocks(blocks)) {
    if (segment.type === "single" && segment.index === index) return true;
    if (segment.type === "grid-row" && segment.startIndex === index) {
      return true;
    }
  }

  return false;
}

const LAYOUT_DRAG_THRESHOLD = 40;

export function getLayoutDragHint(
  blocks: Block[],
  activeId: string,
  delta: { x: number; y: number },
): ProductPairLayout | null {
  const idx = blocks.findIndex((b) => b.id === activeId);
  if (idx === -1) return null;

  const block = blocks[idx];
  if (!isGridBlock(block)) return null;

  const isHorizontal =
    Math.abs(delta.x) > LAYOUT_DRAG_THRESHOLD &&
    Math.abs(delta.x) > Math.abs(delta.y) * 1.2;
  const isVertical =
    Math.abs(delta.y) > LAYOUT_DRAG_THRESHOLD &&
    Math.abs(delta.y) > Math.abs(delta.x) * 1.2;

  const prev = idx > 0 ? blocks[idx - 1] : undefined;
  const next = idx < blocks.length - 1 ? blocks[idx + 1] : undefined;

  if (isHorizontal) {
    const canPair =
      (prev &&
        canPairTogether(prev, block) &&
        isExactGridPairAt(blocks, idx - 1) &&
        !isRowPair(prev, block)) ||
      (next &&
        canPairTogether(block, next) &&
        isExactGridPairAt(blocks, idx) &&
        !isRowPair(block, next));
    if (canPair) return "row";
  }

  if (isVertical) {
    const canSplit =
      (prev &&
        canPairTogether(prev, block) &&
        isExactGridPairAt(blocks, idx - 1) &&
        isRowPair(prev, block)) ||
      (next &&
        canPairTogether(block, next) &&
        isExactGridPairAt(blocks, idx) &&
        isRowPair(block, next));
    if (canSplit) return "stack";
  }

  return null;
}

export function applyPairLayoutFromDrag(
  blocks: Block[],
  activeId: string,
  delta: { x: number; y: number },
  originalBlocks?: Block[],
): Block[] {
  if (
    originalBlocks &&
    (blocks.length !== originalBlocks.length ||
      !blocks.every((block, index) => block.id === originalBlocks[index]?.id))
  ) {
    return blocks;
  }

  const idx = blocks.findIndex((b) => b.id === activeId);
  if (idx === -1) return blocks;

  const block = blocks[idx];
  if (!isGridBlock(block)) return blocks;

  const isHorizontal =
    Math.abs(delta.x) > LAYOUT_DRAG_THRESHOLD &&
    Math.abs(delta.x) > Math.abs(delta.y) * 1.2;
  const isVertical =
    Math.abs(delta.y) > LAYOUT_DRAG_THRESHOLD &&
    Math.abs(delta.y) > Math.abs(delta.x) * 1.2;

  if (!isHorizontal && !isVertical) return blocks;

  const prev = idx > 0 ? blocks[idx - 1] : undefined;
  const next = idx < blocks.length - 1 ? blocks[idx + 1] : undefined;

  let targetFirstId: string | null = null;
  let newLayout: ProductPairLayout | null = null;

  if (isHorizontal) {
    if (
      prev &&
      canPairTogether(prev, block) &&
      isExactGridPairAt(blocks, idx - 1) &&
      !isRowPair(prev, block)
    ) {
      targetFirstId = prev.id;
      newLayout = "row";
    } else if (
      next &&
      canPairTogether(block, next) &&
      isExactGridPairAt(blocks, idx) &&
      !isRowPair(block, next)
    ) {
      targetFirstId = block.id;
      newLayout = "row";
    }
  }

  if (isVertical) {
    if (
      prev &&
      canPairTogether(prev, block) &&
      isExactGridPairAt(blocks, idx - 1) &&
      isRowPair(prev, block)
    ) {
      targetFirstId = prev.id;
      newLayout = "stack";
    } else if (
      next &&
      canPairTogether(block, next) &&
      isExactGridPairAt(blocks, idx) &&
      isRowPair(block, next)
    ) {
      targetFirstId = block.id;
      newLayout = "stack";
    }
  }

  if (!targetFirstId || !newLayout) return blocks;

  return blocks.map((b) =>
    b.id === targetFirstId
      ? {
          ...b,
          data: {
            ...b.data,
            pair_layout: newLayout,
            product_pair_layout: undefined,
          },
        }
      : b,
  );
}

/** ドラッグジェスチャーから pair_layout を適用（並び順は変えない） */
export function applyPairLayoutFromGesture(
  blocks: Block[],
  activeId: string,
  delta: { x: number; y: number },
): Block[] {
  return applyPairLayoutFromDrag(blocks, activeId, delta);
}
