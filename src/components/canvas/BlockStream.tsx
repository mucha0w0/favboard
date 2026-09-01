"use client";

import { type Block, type BlockType } from "@/lib/types";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { BlockRenderer } from "./BlockRenderer";

interface BlockStreamProps {
  blocks: Block[];
  editable?: boolean;
  onEditBlock?: (block: Block) => void;
  onDeleteBlock?: (blockId: string) => void;
  onReorder?: (blocks: Block[]) => void;
}

export function createBlock(type: BlockType): Block {
  return {
    id: crypto.randomUUID(),
    type,
    data:
      type === "heading"
        ? { text: "新しい見出し" }
        : type === "text"
          ? { body: "" }
          : type === "product"
            ? { product_size: "standard" }
            : {},
  };
}

const TYPE_LABELS: Record<BlockType, string> = {
  product: "商品",
  heading: "見出し",
  divider: "区切り線",
  text: "テキスト",
};

function blockClass(type: BlockType): string {
  switch (type) {
    case "heading":
      return "block-heading";
    case "product":
      return "block-product";
    case "divider":
      return "block-divider";
    case "text":
      return "block-text";
  }
}

export function BlockStream({
  blocks,
  editable = false,
  onEditBlock,
  onDeleteBlock,
  onReorder,
}: BlockStreamProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(blocks, oldIndex, newIndex));
  }

  const content = (
    <div className="document-body w-full">
      {blocks.length === 0 && editable && (
        <p className="py-12 text-[15px] leading-relaxed text-stone-400">
          左下の ＋ から、商品・テキスト・見出しなどを追加できます
        </p>
      )}

      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
        disabled={!editable}
      >
        {blocks.map((block) => (
          <SortableBlockItem
            key={block.id}
            block={block}
            editable={editable}
            onEditBlock={onEditBlock}
            onDeleteBlock={onDeleteBlock}
          />
        ))}
      </SortableContext>
    </div>
  );

  if (!editable) return content;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      {content}
    </DndContext>
  );
}

function SortableBlockItem({
  block,
  editable,
  onEditBlock,
  onDeleteBlock,
}: {
  block: Block;
  editable: boolean;
  onEditBlock?: (block: Block) => void;
  onDeleteBlock?: (blockId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: !editable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={blockClass(block.type)}>
      <div
        className={`group/block relative flex gap-1 sm:gap-2 ${
          editable && block.type !== "product"
            ? "rounded-sm pr-6 hover:bg-stone-200/40 sm:pr-8"
            : "pr-6 sm:pr-8"
        }`}
      >
        {editable && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="mt-1 flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-stone-300 hover:bg-stone-200/60 hover:text-stone-500 active:cursor-grabbing"
            aria-label="ドラッグして並べ替え"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <BlockItem
          block={block}
          editable={editable}
          onEditBlock={onEditBlock}
          onDeleteBlock={onDeleteBlock}
        />
      </div>
    </div>
  );
}

function BlockItem({
  block,
  editable,
  onEditBlock,
  onDeleteBlock,
}: {
  block: Block;
  editable: boolean;
  onEditBlock?: (block: Block) => void;
  onDeleteBlock?: (blockId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleDelete() {
    if (!onDeleteBlock) return;
    const label = TYPE_LABELS[block.type];
    if (!confirm(`この${label}を削除しますか？`)) return;
    onDeleteBlock(block.id);
    setMenuOpen(false);
  }

  const isClickable =
    editable &&
    (block.type === "product" ||
      block.type === "heading" ||
      block.type === "text");

  const content = <BlockRenderer block={block} editable={editable} />;

  return (
    <>
      <div className="min-w-0 flex-1">
        {isClickable ? (
          <button
            type="button"
            className="w-full cursor-pointer text-left"
            onClick={() => onEditBlock?.(block)}
          >
            {content}
          </button>
        ) : (
          content
        )}
      </div>

      {editable && (
        <div className="absolute right-0 top-0 z-10">
          <button
            type="button"
            className="rounded-md p-1.5 text-stone-300 opacity-0 transition-opacity hover:bg-stone-100 hover:text-stone-600 group-hover/block:opacity-100 data-[open=true]:opacity-100"
            data-open={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="操作メニュー"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-20 min-w-[120px] rounded-lg border border-stone-200/80 bg-white py-1 shadow-lg">
                {block.type !== "divider" && onEditBlock && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-50"
                    onClick={() => {
                      onEditBlock(block);
                      setMenuOpen(false);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    編集
                  </button>
                )}
                {onDeleteBlock && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    削除
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

/** @deprecated Use BlockStream */
export const CardStack = BlockStream;
