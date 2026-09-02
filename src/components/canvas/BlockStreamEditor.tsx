"use client";

import {
  applyPairLayoutFromGesture,
  getBlockDisplayLayout,
  getLayoutDragHint,
} from "@/lib/block-layout";
import { type Block, blocksEqual, getPairLayout } from "@/lib/types";
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
  const dragDeltaRef = useRef({ x: 0, y: 0 });
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
    .map((block) => `${block.id}:${getPairLayout(block) ?? ""}`)
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

  const activeBlockLayout = useMemo(() => {
    if (!activeBlock) return undefined;
    const index = displayBlocks.findIndex((b) => b.id === activeBlock.id);
    if (index === -1) return undefined;
    return getBlockDisplayLayout(displayBlocks, index);
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
    dragDeltaRef.current = { x: 0, y: 0 };
    setOrderedBlocks(currentBlocks);
    setActiveId(id);
    setLayoutHint(null);
    const node = document.querySelector<HTMLElement>(`[data-block-id="${id}"]`);
    if (node) {
      setActiveWidth(node.getBoundingClientRect().width);
    }
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    dragDeltaRef.current = event.delta;
    const nextHint = getLayoutDragHint(
      dragStartBlocksRef.current,
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
    const startBlocks = dragStartBlocksRef.current;
    const activeId = event.active.id as string;
    const delta =
      Math.abs(event.delta.x) + Math.abs(event.delta.y) > 0
        ? event.delta
        : dragDeltaRef.current;

    const layoutBlocks = applyPairLayoutFromGesture(startBlocks, activeId, delta);
    const layoutChanged = !blocksEqual(layoutBlocks, startBlocks);

    setActiveId(null);
    setActiveWidth(null);
    setLayoutHint(null);

    if (layoutChanged) {
      orderedBlocksRef.current = layoutBlocks;
      setOrderedBlocks(layoutBlocks);
      if (!blocksEqual(layoutBlocks, blocksRef.current)) {
        onReorderRef.current?.(layoutBlocks);
      }
      return;
    }

    const finalBlocks = orderedBlocksRef.current;
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
            <BlockPreview
              block={activeBlock}
              inGrid={activeBlockLayout?.inGrid}
              gridSize={activeBlockLayout?.gridSize}
            />
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
