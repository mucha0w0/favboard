"use client";

import { type Block, blocksEqual } from "@/lib/types";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BlockPreview,
  SortableBlockShell,
  type BlockStreamShellProps,
} from "./BlockStreamParts";

const POINTER_ACTIVATION = { distance: 8 } as const;

/**
 * Mixed-height vertical list: collide by pointer Y vs each target's midpoint.
 * - Target above: only after the pointer crosses that midpoint (moving up)
 * - Target below: only after the pointer crosses that midpoint (moving down)
 * Avoids both "must lift a tall block a lot" and "tiny move jumps over a short neighbor".
 */
const verticalPointerMidpoint: CollisionDetection = (args) => {
  const {
    active,
    collisionRect,
    droppableRects,
    droppableContainers,
    pointerCoordinates,
  } = args;

  if (!pointerCoordinates) {
    return closestCenter(args);
  }

  const pointerY = pointerCoordinates.y;
  const activeRect = droppableRects.get(active.id);
  const activeCenterY = activeRect
    ? activeRect.top + activeRect.height / 2
    : collisionRect.top + collisionRect.height / 2;

  const collisions = [];

  for (const droppableContainer of droppableContainers) {
    const { id } = droppableContainer;
    const rect = droppableRects.get(id);
    if (!rect) continue;

    const centerY = rect.top + rect.height / 2;

    if (id !== active.id) {
      if (centerY < activeCenterY) {
        if (pointerY > centerY) continue;
      } else if (centerY > activeCenterY) {
        if (pointerY < centerY) continue;
      }
    }

    collisions.push({
      id,
      data: {
        droppableContainer,
        value: Math.abs(pointerY - centerY),
      },
    });
  }

  return collisions.sort((a, b) => a.data.value - b.data.value);
};

export function BlockStreamEditor({
  blocks,
  onEditBlock,
  onUpdateBlockData,
  onBlockBlur,
  focusBlockId,
  onDeleteBlock,
  onReorder,
  onUpdateBento,
  onBentoChildBlur,
  onPersistBento,
}: BlockStreamShellProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null);
  const [dragSpacerHeight, setDragSpacerHeight] = useState(0);
  const [orderedBlocks, setOrderedBlocks] = useState(blocks);

  const orderedBlocksRef = useRef(blocks);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef(blocks);
  const onReorderRef = useRef(onReorder);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: POINTER_ACTIVATION }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const displayBlocks = activeId ? orderedBlocks : blocks;

  const sortableIds = useMemo(
    () => displayBlocks.map((block) => block.id),
    [displayBlocks],
  );

  const activeBlock = activeId
    ? orderedBlocks.find((b) => b.id === activeId)
    : undefined;

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    orderedBlocksRef.current = blocksRef.current;
    setOrderedBlocks(blocksRef.current);
    setActiveId(id);

    // active.rect.initial is still null here (dnd-kit fills it after render).
    // Measure the live node before React collapses it to the drop line.
    const node = listContainerRef.current?.querySelector(
      `[data-sortable-id="${CSS.escape(id)}"]`,
    );
    setDragSpacerHeight(node?.getBoundingClientRect().height ?? 0);

    const listWidth = listContainerRef.current?.getBoundingClientRect().width;
    if (listWidth) setOverlayWidth(listWidth);
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
    commitBlocks(orderedBlocksRef.current);
    setActiveId(null);
    setOverlayWidth(null);
    setDragSpacerHeight(0);
  }, [commitBlocks]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverlayWidth(null);
    setDragSpacerHeight(0);
    orderedBlocksRef.current = blocksRef.current;
    setOrderedBlocks(blocksRef.current);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={verticalPointerMidpoint}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="document-body w-full">
        {displayBlocks.length === 0 && (
          <p className="py-12 text-[15px] leading-relaxed text-stone-400">
            下の ＋ から、Bento・見出し・テキスト・区切り線を追加できます
          </p>
        )}

        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div ref={listContainerRef} className="flex flex-col">
            {displayBlocks.map((block, index) => (
              <SortableBlockShell
                key={block.id}
                block={block}
                onEditBlock={onEditBlock}
                onUpdateBlockData={onUpdateBlockData}
                onBlockBlur={onBlockBlur}
                focusBlockId={focusBlockId}
                onDeleteBlock={onDeleteBlock}
                onUpdateBento={onUpdateBento}
                onBentoChildBlur={onBentoChildBlur}
                onPersistBento={onPersistBento}
                onMoveUp={() => moveBlock(block.id, "up")}
                onMoveDown={() => moveBlock(block.id, "down")}
                canMoveUp={index > 0}
                canMoveDown={index < displayBlocks.length - 1}
              />
            ))}
            {dragSpacerHeight > 0 ? (
              <div style={{ height: dragSpacerHeight }} aria-hidden />
            ) : null}
          </div>
        </SortableContext>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeBlock ? (
          <div
            className="cursor-grabbing bg-transparent"
            style={overlayWidth ? { width: overlayWidth } : undefined}
          >
            <BlockPreview block={activeBlock} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
