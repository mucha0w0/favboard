"use client";

import { getBlockDisplayLayout } from "@/lib/block-layout";
import { type Block, blocksEqual } from "@/lib/types";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
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
  onUpdateBento,
  onBentoChildBlur,
  onPersistBento,
}: BlockStreamShellProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null);
  const [orderedBlocks, setOrderedBlocks] = useState(blocks);

  const orderedBlocksRef = useRef(blocks);
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
            下の ＋ から、Bento・見出し・区切り線を追加できます
          </p>
        )}

        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div ref={listContainerRef} className="flex flex-col">
            {displayBlocks.map((block, index) => {
              const layout = getBlockDisplayLayout(displayBlocks, index);
              return (
                <SortableBlockShell
                  key={block.id}
                  block={block}
                  className={layout.colClass}
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
              );
            })}
          </div>
        </SortableContext>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeBlock ? (
          <div
            className="cursor-grabbing rounded-sm bg-white shadow-lg ring-1 ring-stone-200/80"
            style={overlayWidth ? { width: overlayWidth } : undefined}
          >
            <BlockPreview block={activeBlock} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
