"use client";

import {
  applyPairLayoutFromDrag,
  getBlockDisplayLayout,
  isExactGridPairAt,
  isRowPair,
  segmentBlocks,
} from "@/lib/block-layout";
import {
  type Block,
  blocksEqual,
  getProductSize,
  isGridProduct,
} from "@/lib/types";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  BlockPreview,
  SortableBlockShell,
  StaticBlockShell,
  type BlockStreamShellProps,
} from "./BlockStreamParts";

const POINTER_ACTIVATION = { distance: 8 } as const;
const LAYOUT_DRAG_THRESHOLD = 40;

function getLayoutDragHint(
  blocks: Block[],
  activeId: string,
  delta: { x: number; y: number },
): "row" | "stack" | null {
  const idx = blocks.findIndex((b) => b.id === activeId);
  if (idx === -1) return null;

  const block = blocks[idx];
  if (!isGridProduct(block)) return null;

  const isHorizontal =
    Math.abs(delta.x) > LAYOUT_DRAG_THRESHOLD &&
    Math.abs(delta.x) > Math.abs(delta.y) * 1.2;
  const isVertical =
    Math.abs(delta.y) > LAYOUT_DRAG_THRESHOLD &&
    Math.abs(delta.y) > Math.abs(delta.x) * 1.2;

  const size = getProductSize(block);
  const prev = idx > 0 ? blocks[idx - 1] : undefined;
  const next = idx < blocks.length - 1 ? blocks[idx + 1] : undefined;

  if (isHorizontal) {
    const canPair =
      (prev &&
        isGridProduct(prev) &&
        getProductSize(prev) === size &&
        isExactGridPairAt(blocks, idx - 1) &&
        !isRowPair(prev, block)) ||
      (next &&
        isGridProduct(next) &&
        getProductSize(next) === size &&
        isExactGridPairAt(blocks, idx) &&
        !isRowPair(block, next));
    if (canPair) return "row";
  }

  if (isVertical) {
    const canSplit =
      (prev &&
        isGridProduct(prev) &&
        getProductSize(prev) === size &&
        isExactGridPairAt(blocks, idx - 1) &&
        isRowPair(prev, block)) ||
      (next &&
        isGridProduct(next) &&
        getProductSize(next) === size &&
        isExactGridPairAt(blocks, idx) &&
        isRowPair(block, next));
    if (canSplit) return "stack";
  }

  return null;
}

export function BlockStreamEditor({
  blocks,
  onEditBlock,
  onUpdateBlockData,
  onBlockBlur,
  focusBlockId,
  onDeleteBlock,
  onReorder,
}: BlockStreamShellProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeWidth, setActiveWidth] = useState<number | null>(null);
  const [layoutHint, setLayoutHint] = useState<"row" | "stack" | null>(null);
  const [orderedBlocks, setOrderedBlocks] = useState(blocks);

  const orderedBlocksRef = useRef(blocks);
  const dragStartBlocksRef = useRef(blocks);
  const blocksRef = useRef(blocks);
  const onReorderRef = useRef(onReorder);

  blocksRef.current = blocks;
  onReorderRef.current = onReorder;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: POINTER_ACTIVATION }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const displayBlocks = activeId ? orderedBlocks : blocks;

  const sortableIdsKey = displayBlocks.map((block) => block.id).join("\0");
  const layoutKey = displayBlocks
    .map((block) => `${block.id}:${block.data.product_pair_layout ?? ""}`)
    .join("\0");

  const sortableIds = useMemo(
    () => displayBlocks.map((block) => block.id),
    [sortableIdsKey],
  );

  const blockLayouts = useMemo(
    () =>
      displayBlocks.map((block, index) => ({
        block,
        index,
        layout: getBlockDisplayLayout(displayBlocks, index),
      })),
    [displayBlocks, layoutKey, sortableIdsKey],
  );

  const activeBlock = activeId
    ? orderedBlocks.find((b) => b.id === activeId)
    : undefined;

  const activeBlockGridSize = useMemo(() => {
    if (!activeBlock) return undefined;
    for (const segment of segmentBlocks(displayBlocks)) {
      if (
        segment.type === "grid-row" &&
        segment.blocks.some((block) => block.id === activeBlock.id)
      ) {
        return segment.size;
      }
    }
    return undefined;
  }, [activeBlock, sortableIdsKey, layoutKey]);

  const moveBlock = useCallback(
    (blockId: string, direction: "up" | "down") => {
      const reorder = onReorderRef.current;
      if (!reorder) return;
      const current = activeId ? orderedBlocksRef.current : blocksRef.current;
      const index = current.findIndex((b) => b.id === blockId);
      if (index === -1) return;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= current.length) return;
      reorder(arrayMove(current, index, newIndex));
    },
    [activeId],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    const currentBlocks = blocksRef.current;
    dragStartBlocksRef.current = currentBlocks;
    orderedBlocksRef.current = currentBlocks;
    setOrderedBlocks(currentBlocks);
    setActiveId(id);
    setLayoutHint(null);
    const node = document.querySelector<HTMLElement>(`[data-block-id="${id}"]`);
    if (node) {
      setActiveWidth(node.getBoundingClientRect().width);
    }
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const nextHint = getLayoutDragHint(
      orderedBlocksRef.current,
      event.active.id as string,
      event.delta,
    );
    setLayoutHint((prev) => (prev === nextHint ? prev : nextHint));
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedBlocks((current) => {
      const oldIndex = current.findIndex((b) => b.id === active.id);
      const newIndex = current.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return current;
      }
      const next = arrayMove(current, oldIndex, newIndex);
      orderedBlocksRef.current = next;
      return next;
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const finalBlocks = applyPairLayoutFromDrag(
      orderedBlocksRef.current,
      event.active.id as string,
      event.delta,
      dragStartBlocksRef.current,
    );

    orderedBlocksRef.current = finalBlocks;

    setActiveId(null);
    setActiveWidth(null);
    setLayoutHint(null);

    if (!blocksEqual(finalBlocks, blocksRef.current)) {
      onReorderRef.current?.(finalBlocks);
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveWidth(null);
    setLayoutHint(null);
    orderedBlocksRef.current = blocksRef.current;
    setOrderedBlocks(blocksRef.current);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="document-body w-full">
        {displayBlocks.length === 0 && (
          <p className="py-12 text-[15px] leading-relaxed text-stone-400">
            下の ＋ から、商品・テキスト・見出しなどを追加できます
          </p>
        )}

        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-6 gap-x-3">
            {blockLayouts.map(
              ({ block, index, layout }) => (
                <SortableBlockShell
                  key={block.id}
                  block={block}
                  className={layout.colClass}
                  inGrid={layout.inGrid}
                  gridSize={layout.gridSize}
                  onEditBlock={onEditBlock}
                  onUpdateBlockData={onUpdateBlockData}
                  onBlockBlur={onBlockBlur}
                  autoFocus={focusBlockId === block.id}
                  onDeleteBlock={onDeleteBlock}
                  onMoveUp={() => moveBlock(block.id, "up")}
                  onMoveDown={() => moveBlock(block.id, "down")}
                  canMoveUp={index > 0}
                  canMoveDown={index < displayBlocks.length - 1}
                />
              ),
            )}
          </div>
        </SortableContext>
      </div>

      {layoutHint && activeId && (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
          <div className="menu-float rounded-full px-4 py-2 text-sm text-stone-600">
            {layoutHint === "row" ? "横並びに配置" : "縦並びに配置"}
          </div>
        </div>
      )}

      <DragOverlay dropAnimation={null}>
        {activeBlock ? (
          <div
            className="cursor-grabbing opacity-90"
            style={activeWidth ? { width: activeWidth } : undefined}
          >
            <BlockPreview block={activeBlock} gridSize={activeBlockGridSize} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** SSR / dynamic import 用プレースホルダー */
export function BlockStreamEditorPlaceholder({
  blocks,
  onEditBlock,
  onUpdateBlockData,
  onBlockBlur,
  focusBlockId,
  onDeleteBlock,
}: BlockStreamShellProps) {
  const blockLayouts = useMemo(
    () =>
      blocks.map((block, index) => ({
        block,
        index,
        layout: getBlockDisplayLayout(blocks, index),
      })),
    [blocks],
  );

  return (
    <div className="document-body w-full" aria-hidden>
      <div className="grid grid-cols-6 gap-x-3">
        {blockLayouts.map(({ block, index, layout }) => (
          <div key={block.id} className={layout.colClass}>
            <StaticBlockShell
              block={block}
              inGrid={layout.inGrid}
              gridSize={layout.gridSize}
              onEditBlock={onEditBlock}
              onUpdateBlockData={onUpdateBlockData}
              onBlockBlur={onBlockBlur}
              autoFocus={focusBlockId === block.id}
              onDeleteBlock={onDeleteBlock}
              onMoveUp={() => {}}
              onMoveDown={() => {}}
              canMoveUp={index > 0}
              canMoveDown={index < blocks.length - 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
