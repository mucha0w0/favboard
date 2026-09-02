"use client";

import { type Block, type BlockType } from "@/lib/types";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { BlockRenderer } from "./BlockRenderer";

interface BlockStreamProps {
  blocks: Block[];
  editable?: boolean;
  onEditBlock?: (block: Block) => void;
  onDeleteBlock?: (blockId: string) => void;
  onReorder?: (blocks: Block[]) => void;
  onInsertBlock?: (type: BlockType, index: number) => void;
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

const INSERT_ITEMS: { type: BlockType; label: string }[] = [
  { type: "product", label: "商品" },
  { type: "text", label: "テキスト" },
  { type: "heading", label: "見出し" },
  { type: "divider", label: "区切り線" },
];

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

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function BlockStream({
  blocks,
  editable = false,
  onEditBlock,
  onDeleteBlock,
  onReorder,
  onInsertBlock,
}: BlockStreamProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [activeWidth, setActiveWidth] = useState<number | null>(null);
  const dndReady = useIsClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeBlock = activeId
    ? blocks.find((b) => b.id === activeId)
    : undefined;

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    setActiveId(id);
    const node = document.querySelector<HTMLElement>(`[data-block-id="${id}"]`);
    if (node) {
      setActiveWidth(node.getBoundingClientRect().width);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    setActiveWidth(null);

    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(blocks, oldIndex, newIndex));
  }

  function handleDragCancel() {
    setActiveId(null);
    setOverId(null);
    setActiveWidth(null);
  }

  function moveBlock(blockId: string, direction: "up" | "down") {
    if (!onReorder) return;
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    onReorder(arrayMove(blocks, index, newIndex));
  }

  function renderBlockList(sortable: boolean) {
    return (
      <div className="document-body w-full">
        {blocks.length === 0 && editable && (
          <p className="py-12 text-[15px] leading-relaxed text-stone-400">
            下の ＋ から、商品・テキスト・見出しなどを追加できます
          </p>
        )}

        {sortable ? (
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {renderBlocks(true)}
          </SortableContext>
        ) : (
          renderBlocks(false)
        )}
      </div>
    );
  }

  function renderBlocks(sortable: boolean) {
    return (
      <>
        {blocks.map((block, index) => (
          <div key={block.id}>
            {editable && onInsertBlock && (
              <InsertZone
                index={index}
                onInsert={onInsertBlock}
                disabled={activeId !== null}
              />
            )}
            {sortable ? (
              <SortableBlockItem
                block={block}
                editable={editable}
                isDragging={activeId === block.id}
                showDropIndicator={
                  activeId !== null &&
                  overId === block.id &&
                  activeId !== block.id
                }
                onEditBlock={onEditBlock}
                onDeleteBlock={onDeleteBlock}
                onMoveUp={() => moveBlock(block.id, "up")}
                onMoveDown={() => moveBlock(block.id, "down")}
                canMoveUp={index > 0}
                canMoveDown={index < blocks.length - 1}
              />
            ) : (
              <StaticBlockItem
                block={block}
                editable={editable}
                onEditBlock={onEditBlock}
                onDeleteBlock={onDeleteBlock}
                onMoveUp={() => moveBlock(block.id, "up")}
                onMoveDown={() => moveBlock(block.id, "down")}
                canMoveUp={index > 0}
                canMoveDown={index < blocks.length - 1}
              />
            )}
          </div>
        ))}
        {editable && onInsertBlock && blocks.length > 0 && (
          <InsertZone
            index={blocks.length}
            onInsert={onInsertBlock}
            disabled={activeId !== null}
          />
        )}
      </>
    );
  }

  if (!editable) return renderBlockList(false);

  // DndContext generates client-only aria IDs — defer until mount to avoid hydration mismatch.
  if (!dndReady) return renderBlockList(false);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragOver={({ over }) => setOverId(over?.id as string | null)}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {renderBlockList(true)}
      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeBlock ? (
          <div
            className="cursor-grabbing rounded-md border border-stone-200 bg-white"
            style={activeWidth ? { width: activeWidth } : undefined}
          >
            <BlockPreview block={activeBlock} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function BlockPreview({ block }: { block: Block }) {
  return (
    <div className={blockClass(block.type)}>
      <div className="flex gap-1 sm:gap-2 pr-2 sm:pr-3">
        <div className="w-7 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 py-1">
          <BlockRenderer block={block} editable />
        </div>
      </div>
    </div>
  );
}

function InsertZone({
  index,
  onInsert,
  disabled,
}: {
  index: number;
  onInsert: (type: BlockType, index: number) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`group/insert relative flex h-3 items-center justify-center ${
        disabled ? "pointer-events-none" : ""
      }`}
    >
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-transparent transition-colors group-hover/insert:bg-stone-200" />
      <div className="relative z-10 opacity-0 transition-opacity group-hover/insert:opacity-100">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-500 shadow-sm hover:border-stone-400 hover:bg-stone-50 hover:text-stone-700"
          aria-label="ここにブロックを追加"
        >
          <Plus className="h-3 w-3" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <div className="absolute left-1/2 top-full z-30 mt-1 min-w-[140px] -translate-x-1/2 rounded-md border border-stone-200 bg-white py-1">
              {INSERT_ITEMS.map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  className="flex w-full px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-50"
                  onClick={() => {
                    onInsert(type, index);
                    setOpen(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StaticBlockItem({
  block,
  editable,
  onEditBlock,
  onDeleteBlock,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  block: Block;
  editable: boolean;
  onEditBlock?: (block: Block) => void;
  onDeleteBlock?: (blockId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div data-block-id={block.id} className={`relative ${blockClass(block.type)}`}>
      <div
        className={`group/block relative flex gap-1 rounded-lg border border-transparent sm:gap-2 ${
          editable
            ? "pr-2 hover:border-stone-200 hover:bg-white/60 sm:pr-3"
            : "pr-6 sm:pr-8"
        }`}
      >
        {editable && (
          <div
            className="mt-1 flex h-9 w-7 shrink-0 items-center justify-center self-start rounded-md text-stone-300"
            aria-hidden
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <BlockItem
          block={block}
          editable={editable}
          onEditBlock={onEditBlock}
          onDeleteBlock={onDeleteBlock}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
        />
      </div>
    </div>
  );
}

function SortableBlockItem({
  block,
  editable,
  isDragging,
  showDropIndicator,
  onEditBlock,
  onDeleteBlock,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  block: Block;
  editable: boolean;
  isDragging: boolean;
  showDropIndicator: boolean;
  onEditBlock?: (block: Block) => void;
  onDeleteBlock?: (blockId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: block.id, disabled: !editable });

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition: isSortableDragging ? undefined : transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-block-id={block.id}
      className={`relative ${blockClass(block.type)}`}
    >
      {showDropIndicator && (
        <div
          className="pointer-events-none absolute -top-1 left-8 right-8 z-20 h-0.5 rounded-full bg-stone-800"
          aria-hidden
        />
      )}
      <div
        className={`group/block relative flex gap-1 rounded-lg border border-transparent sm:gap-2 ${
          editable
            ? "pr-2 hover:border-stone-200 hover:bg-white/60 sm:pr-3"
            : "pr-6 sm:pr-8"
        }`}
      >
        {editable && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="mt-1 flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center self-start rounded-md text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-500 active:cursor-grabbing"
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
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
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
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  block: Block;
  editable: boolean;
  onEditBlock?: (block: Block) => void;
  onDeleteBlock?: (blockId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
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
      <div className="min-w-0 flex-1 py-1">
        {isClickable ? (
          <button
            type="button"
            className="w-full cursor-pointer rounded-md text-left transition-colors hover:ring-1 hover:ring-stone-200/80"
            onClick={() => onEditBlock?.(block)}
          >
            {content}
          </button>
        ) : (
          content
        )}
      </div>

      {editable && (
        <div className="absolute right-0 top-1 z-10">
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
              <div className="absolute right-0 top-8 z-20 min-w-[140px] rounded-md border border-stone-200 bg-white py-1">
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
                <button
                  type="button"
                  disabled={!canMoveUp}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-40"
                  onClick={() => {
                    onMoveUp();
                    setMenuOpen(false);
                  }}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                  上に移動
                </button>
                <button
                  type="button"
                  disabled={!canMoveDown}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-40"
                  onClick={() => {
                    onMoveDown();
                    setMenuOpen(false);
                  }}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                  下に移動
                </button>
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
