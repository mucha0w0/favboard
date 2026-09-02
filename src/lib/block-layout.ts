import {
  type Block,
  getGridMaxColumns,
  getProductSize,
  isGridProduct,
} from "@/lib/types";

export type ProductPairLayout = "row" | "stack";

export type BlockSegment =
  | { type: "single"; block: Block; index: number }
  | {
      type: "grid-row";
      blocks: Block[];
      size: "compact" | "standard";
      startIndex: number;
      /** 2件ペアの横並び / 3件以上の自動グリッド */
      mode: "pair" | "auto";
    };

export function isRowPair(first: Block, second: Block | undefined): boolean {
  if (!second || !isGridProduct(first) || !isGridProduct(second)) return false;
  if (getProductSize(first) !== getProductSize(second)) return false;
  return first.data.product_pair_layout === "row";
}

/** 同サイズ S/M がちょうど2件だけ連続しているか */
export function isExactGridPairAt(blocks: Block[], firstIndex: number): boolean {
  const first = blocks[firstIndex];
  const second = blocks[firstIndex + 1];
  if (!second || !isGridProduct(first) || !isGridProduct(second)) return false;
  if (getProductSize(first) !== getProductSize(second)) return false;

  const size = getProductSize(first);
  const before = firstIndex > 0 ? blocks[firstIndex - 1] : undefined;
  const after =
    firstIndex + 2 < blocks.length ? blocks[firstIndex + 2] : undefined;
  const sameBefore =
    before && isGridProduct(before) && getProductSize(before) === size;
  const sameAfter =
    after && isGridProduct(after) && getProductSize(after) === size;

  return !sameBefore && !sameAfter;
}

function segmentGridRun(run: Block[], runStart: number): BlockSegment[] {
  const segments: BlockSegment[] = [];
  let i = 0;
  let absIndex = runStart;

  while (i < run.length) {
    const block = run[i];
    const size = getProductSize(block) as "compact" | "standard";
    const next = run[i + 1];

    if (next && getProductSize(next) === size && isRowPair(block, next)) {
      segments.push({
        type: "grid-row",
        blocks: [block, next],
        size,
        startIndex: absIndex,
        mode: "pair",
      });
      i += 2;
      absIndex += 2;
      continue;
    }

    const maxCols = getGridMaxColumns(size);
    const rowBlocks: Block[] = [block];
    let j = i + 1;

    while (j < run.length && getProductSize(run[j]) === size && rowBlocks.length < maxCols) {
      if (isRowPair(run[j], run[j + 1])) break;
      rowBlocks.push(run[j]);
      j++;
    }

    if (rowBlocks.length === 1) {
      segments.push({ type: "single", block: rowBlocks[0], index: absIndex });
      absIndex += 1;
    } else if (
      rowBlocks.length === 2 &&
      !isRowPair(rowBlocks[0], rowBlocks[1])
    ) {
      segments.push({ type: "single", block: rowBlocks[0], index: absIndex });
      absIndex += 1;
      segments.push({ type: "single", block: rowBlocks[1], index: absIndex });
      absIndex += 1;
    } else {
      segments.push({
        type: "grid-row",
        blocks: rowBlocks,
        size,
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

    if (!isGridProduct(block)) {
      segments.push({ type: "single", block, index: i });
      i++;
      continue;
    }

    const runStart = i;
    const run: Block[] = [];
    while (i < blocks.length && isGridProduct(blocks[i])) {
      run.push(blocks[i]);
      i++;
    }

    segments.push(...segmentGridRun(run, runStart));
  }

  return segments;
}

export function gridColumnClass(count: number, size: "compact" | "standard"): string {
  if (count <= 1) return "grid-cols-1";
  if (size === "compact" && count >= 3) return "grid-cols-3";
  return "grid-cols-2";
}

const LAYOUT_DRAG_THRESHOLD = 40;

export function applyPairLayoutFromDrag(
  blocks: Block[],
  activeId: string,
  delta: { x: number; y: number },
  /** ドラッグ開始時の並び — 並び替え操作とレイアウト切替を区別する */
  originalBlocks: Block[],
): Block[] {
  const orderUnchanged =
    blocks.length === originalBlocks.length &&
    blocks.every((block, index) => block.id === originalBlocks[index]?.id);

  if (!orderUnchanged) return blocks;

  const idx = blocks.findIndex((b) => b.id === activeId);
  if (idx === -1) return blocks;

  const block = blocks[idx];
  if (!isGridProduct(block)) return blocks;

  const isHorizontal =
    Math.abs(delta.x) > LAYOUT_DRAG_THRESHOLD &&
    Math.abs(delta.x) > Math.abs(delta.y) * 1.2;
  const isVertical =
    Math.abs(delta.y) > LAYOUT_DRAG_THRESHOLD &&
    Math.abs(delta.y) > Math.abs(delta.x) * 1.2;

  if (!isHorizontal && !isVertical) return blocks;

  const size = getProductSize(block);
  const prev = idx > 0 ? blocks[idx - 1] : undefined;
  const next = idx < blocks.length - 1 ? blocks[idx + 1] : undefined;

  let targetFirstId: string | null = null;
  let newLayout: ProductPairLayout | null = null;

  if (isHorizontal) {
    if (
      prev &&
      isGridProduct(prev) &&
      getProductSize(prev) === size &&
      isExactGridPairAt(blocks, idx - 1) &&
      !isRowPair(prev, block)
    ) {
      targetFirstId = prev.id;
      newLayout = "row";
    } else if (
      next &&
      isGridProduct(next) &&
      getProductSize(next) === size &&
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
      isGridProduct(prev) &&
      getProductSize(prev) === size &&
      isExactGridPairAt(blocks, idx - 1) &&
      isRowPair(prev, block)
    ) {
      targetFirstId = prev.id;
      newLayout = "stack";
    } else if (
      next &&
      isGridProduct(next) &&
      getProductSize(next) === size &&
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
      ? { ...b, data: { ...b.data, product_pair_layout: newLayout } }
      : b,
  );
}
