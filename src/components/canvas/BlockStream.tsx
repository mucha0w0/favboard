"use client";

import { type Block, type BlockType } from "@/lib/types";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
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
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { BlockRenderer } from "./BlockRenderer";

interface BlockStreamProps {
  blocks: Block[];
  editable?: boolean;
  onEditBlock?: (block: Block) => void;
  onUpdateBlockData?: (blockId: string, data: Partial<Block["data"]>) => void;
  onBlockBlur?: (blockId: string) => void;
  focusBlockId?: string | null;
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
        ? { text: "" }
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
  onUpdateBlockData,
  onBlockBlur,
  focusBlockId,
  onDeleteBlock,
  onReorder,
  onInsertBlock,
}: BlockStreamProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeWidth, setActiveWidth] = useState<number | null>(null);
  const [orderedBlocks, setOrderedBlocks] = useState(blocks);
  const orderedBlocksRef = useRef(blocks);
  const dndReady = useIsClient();

  useEffect(() => {
    if (!activeId) {
      setOrderedBlocks(blocks);
      orderedBlocksRef.current = blocks;
    }
  }, [blocks, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const displayBlocks = activeId ? orderedBlocks : blocks;

  const activeBlock = activeId
    ? orderedBlocks.find((b) => b.id === activeId)
    : undefined;

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    setOrderedBlocks(blocks);
    orderedBlocksRef.current = blocks;
    setActiveId(id);
    const node = document.querySelector<HTMLElement>(`[data-block-id="${id}"]`);
    if (node) {
      setActiveWidth(node.getBoundingClientRect().width);
    }
  }

  function handleDragOver(event: DragOverEvent) {
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
  }

  function handleDragEnd() {
    const finalBlocks = orderedBlocksRef.current;
    const orderChanged = finalBlocks.some(
      (block, index) => block.id !== blocks[index]?.id,
    );

    if (orderChanged && onReorder) {
      onReorder(finalBlocks);
    }

    setActiveId(null);
    setActiveWidth(null);
  }

  function handleDragCancel() {
    setActiveId(null);
    setActiveWidth(null);
    setOrderedBlocks(blocks);
    orderedBlocksRef.current = blocks;
  }

  function moveBlock(blockId: string, direction: "up" | "down") {
    if (!onReorder) return;
    const index = displayBlocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= displayBlocks.length) return;
    onReorder(arrayMove(displayBlocks, index, newIndex));
  }

  function renderBlockList(sortable: boolean) {
    return (
      <div className="document-body w-full">
        {displayBlocks.length === 0 && editable && (
          <p className="py-12 text-[15px] leading-relaxed text-stone-400">
            下の ＋ から、商品・テキスト・見出しなどを追加できます
          </p>
        )}

        {sortable ? (
          <SortableContext
            items={displayBlocks.map((b) => b.id)}
            strategy={rectSortingStrategy}
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
        {displayBlocks.map((block, index) =>
          sortable ? (
            <SortableBlockItem
              key={block.id}
              block={block}
              editable={editable}
              insertZone={
                editable && onInsertBlock ? (
                  <InsertZone
                    index={index}
                    onInsert={onInsertBlock}
                    disabled={activeId !== null}
                  />
                ) : null
              }
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
          ) : (
            <div key={block.id}>
              {editable && onInsertBlock && (
                <InsertZone
                  index={index}
                  onInsert={onInsertBlock}
                  disabled={activeId !== null}
                />
              )}
              <StaticBlockItem
                block={block}
                editable={editable}
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
            </div>
          ),
        )}
        {editable && onInsertBlock && displayBlocks.length > 0 && (
          <InsertZone
            index={displayBlocks.length}
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
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {renderBlockList(true)}
      <DragOverlay dropAnimation={null}>
        {activeBlock ? (
          <div
            className="cursor-grabbing opacity-90"
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
          className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-white transition-opacity hover:opacity-80"
          aria-label="ここにブロックを追加"
        >
          <Plus className="h-3 w-3" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <div className="menu-float absolute left-1/2 top-full z-30 mt-1 min-w-[140px] -translate-x-1/2 py-1">
              {INSERT_ITEMS.map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  className="flex w-full px-3 py-2 text-left text-sm text-stone-600 transition-colors hover:text-stone-900"
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
  onUpdateBlockData,
  onBlockBlur,
  autoFocus,
  onDeleteBlock,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  block: Block;
  editable: boolean;
  onEditBlock?: (block: Block) => void;
  onUpdateBlockData?: (blockId: string, data: Partial<Block["data"]>) => void;
  onBlockBlur?: (blockId: string) => void;
  autoFocus?: boolean;
  onDeleteBlock?: (blockId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div data-block-id={block.id} className={`relative ${blockClass(block.type)}`}>
      <div
        className={`group/block relative flex gap-1 sm:gap-2 ${
          editable ? "pr-2 sm:pr-3" : "pr-6 sm:pr-8"
        }`}
      >
        {editable && (
          <div
            className="mt-1 flex h-9 w-7 shrink-0 items-center justify-center self-start text-stone-300"
            aria-hidden
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <BlockItem
          block={block}
          editable={editable}
          onEditBlock={onEditBlock}
          onUpdateBlockData={onUpdateBlockData}
          onBlockBlur={onBlockBlur}
          autoFocus={autoFocus}
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
  insertZone,
  onEditBlock,
  onUpdateBlockData,
  onBlockBlur,
  autoFocus,
  onDeleteBlock,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  block: Block;
  editable: boolean;
  insertZone?: ReactNode;
  onEditBlock?: (block: Block) => void;
  onUpdateBlockData?: (blockId: string, data: Partial<Block["data"]>) => void;
  onBlockBlur?: (blockId: string) => void;
  autoFocus?: boolean;
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
    isDragging,
  } = useSortable({
    id: block.id,
    disabled: !editable,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {insertZone}
      <div
        data-block-id={block.id}
        className={`relative ${blockClass(block.type)}`}
      >
        <div
          className={`group/block relative flex gap-1 sm:gap-2 ${
            editable ? "pr-2 sm:pr-3" : "pr-6 sm:pr-8"
          }`}
        >
        {editable && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="mt-1 flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center self-start text-stone-300 transition-colors hover:text-stone-500 active:cursor-grabbing"
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
            onUpdateBlockData={onUpdateBlockData}
            onBlockBlur={onBlockBlur}
            autoFocus={autoFocus}
            onDeleteBlock={onDeleteBlock}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
          />
        </div>
      </div>
    </div>
  );
}

function BlockItem({
  block,
  editable,
  onEditBlock,
  onUpdateBlockData,
  onBlockBlur,
  autoFocus,
  onDeleteBlock,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  block: Block;
  editable: boolean;
  onEditBlock?: (block: Block) => void;
  onUpdateBlockData?: (blockId: string, data: Partial<Block["data"]>) => void;
  onBlockBlur?: (blockId: string) => void;
  autoFocus?: boolean;
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

  const isProductClickable = editable && block.type === "product";

  const content = (
    <BlockRenderer
      block={block}
      editable={editable}
      onUpdateBlockData={onUpdateBlockData}
      onBlockBlur={onBlockBlur}
      autoFocus={autoFocus}
    />
  );

  return (
    <>
      <div className="min-w-0 flex-1 py-1">
        {isProductClickable ? (
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
        <div className="absolute right-0 top-1 z-10">
          <button
            type="button"
            className="p-1.5 text-stone-300 opacity-0 transition-opacity hover:text-stone-600 group-hover/block:opacity-100 data-[open=true]:opacity-100"
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
              <div className="menu-float absolute right-0 top-8 z-20 min-w-[140px] py-1">
                {block.type === "product" && onEditBlock && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-600 transition-colors hover:text-stone-900"
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
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-600 transition-colors hover:text-stone-900 disabled:opacity-40"
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
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-600 transition-colors hover:text-stone-900 disabled:opacity-40"
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
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:text-red-700"
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
