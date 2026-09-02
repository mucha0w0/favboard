"use client";

import {
  applyPairLayoutAction,
  getBlockDisplayLayout,
  getPairLayoutActions,
  type BlockDisplayLayout,
  type PairLayoutAction,
} from "@/lib/block-layout";
import { type Block, blocksEqual, getPairLayout } from "@/lib/types";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
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
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null);
  const [orderedBlocks, setOrderedBlocks] = useState(blocks);

  const orderedBlocksRef = useRef(blocks);
  const dragStartLayoutsRef = useRef<Map<string, BlockDisplayLayout>>(new Map());
  const listContainerRef = useRef<HTMLDivElement>(null);
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
  const isDragging = activeId !== null;

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
      displayBlocks.map((block, index) => {
        const layout = isDragging
          ? (dragStartLayoutsRef.current.get(block.id) ??
            getBlockDisplayLayout(displayBlocks, index))
          : getBlockDisplayLayout(displayBlocks, index);
        return { block, index, layout };
      }),
    [displayBlocks, isDragging, layoutKey, sortableIdsKey],
  );

  const activeBlock = activeId
    ? orderedBlocks.find((b) => b.id === activeId)
    : undefined;

  const activeBlockLayout = useMemo(() => {
    if (!activeBlock) return undefined;
    if (isDragging) {
      return dragStartLayoutsRef.current.get(activeBlock.id);
    }
    const index = displayBlocks.findIndex((b) => b.id === activeBlock.id);
    if (index === -1) return undefined;
    return getBlockDisplayLayout(displayBlocks, index);
  }, [activeBlock, displayBlocks, isDragging, sortableIdsKey, layoutKey]);

  const commitBlocks = useCallback((nextBlocks: Block[]) => {
    if (!blocksEqual(nextBlocks, blocksRef.current)) {
      onReorderRef.current?.(nextBlocks);
    }
  }, []);

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

  const handlePairLayoutAction = useCallback(
    (blockId: string, action: PairLayoutAction) => {
      const next = applyPairLayoutAction(blocksRef.current, blockId, action);
      commitBlocks(next);
    },
    [commitBlocks],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    const currentBlocks = blocksRef.current;

    dragStartLayoutsRef.current = new Map(
      currentBlocks.map((block, index) => [
        block.id,
        getBlockDisplayLayout(currentBlocks, index),
      ]),
    );
    orderedBlocksRef.current = currentBlocks;
    setOrderedBlocks(currentBlocks);
    setActiveId(id);

    const listWidth = listContainerRef.current?.getBoundingClientRect().width;
    if (listWidth) {
      setOverlayWidth(listWidth);
    }
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

  const handleDragEnd = useCallback(() => {
    const finalBlocks = orderedBlocksRef.current;
    setActiveId(null);
    setOverlayWidth(null);
    commitBlocks(finalBlocks);
  }, [commitBlocks]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverlayWidth(null);
    orderedBlocksRef.current = blocksRef.current;
    setOrderedBlocks(blocksRef.current);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
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

        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div
            ref={listContainerRef}
            className={
              isDragging ? "flex flex-col gap-y-0" : "grid grid-cols-6 gap-x-3"
            }
          >
            {blockLayouts.map(({ block, index, layout }) => (
              <SortableBlockShell
                key={block.id}
                block={block}
                className={isDragging ? "w-full" : layout.colClass}
                inGrid={layout.inGrid}
                gridSize={layout.gridSize}
                pairLayoutActions={getPairLayoutActions(displayBlocks, block.id)}
                onPairLayoutAction={handlePairLayoutAction}
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
            ))}
          </div>
        </SortableContext>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeBlock ? (
          <div
            className="cursor-grabbing rounded-sm bg-white shadow-lg ring-1 ring-stone-200/80"
            style={overlayWidth ? { width: overlayWidth } : undefined}
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
