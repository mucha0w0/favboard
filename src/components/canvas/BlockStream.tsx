"use client";

import {
  applyPairLayoutFromDrag,
  gridColumnClass,
  isExactGridPairAt,
  isRowPair,
  segmentBlocks,
} from "@/lib/block-layout";
import {
  type Block,
  type BlockType,
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
  const [layoutHint, setLayoutHint] = useState<"row" | "stack" | null>(null);
  const [orderedBlocks, setOrderedBlocks] = useState(blocks);
  const orderedBlocksRef = useRef(blocks);
  const dragStartBlocksRef = useRef(blocks);
  const dndReady = useIsClient();

  useEffect(() => {
    if (activeId) return;
    setOrderedBlocks((prev) => {
      if (blocksEqual(prev, blocks)) return prev;
      orderedBlocksRef.current = blocks;
      return blocks;
    });
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
    dragStartBlocksRef.current = blocks;
    setOrderedBlocks(blocks);
    orderedBlocksRef.current = blocks;
    setActiveId(id);
    setLayoutHint(null);
    const node = document.querySelector<HTMLElement>(`[data-block-id="${id}"]`);
    if (node) {
      setActiveWidth(node.getBoundingClientRect().width);
    }
  }

  function handleDragMove(event: DragMoveEvent) {
    const nextHint = getLayoutDragHint(
      orderedBlocksRef.current,
      event.active.id as string,
      event.delta,
    );
    setLayoutHint((prev) => (prev === nextHint ? prev : nextHint));
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

  function handleDragEnd(event: DragEndEvent) {
    const finalBlocks = applyPairLayoutFromDrag(
      orderedBlocksRef.current,
      event.active.id as string,
      event.delta,
      dragStartBlocksRef.current,
    );

    const changed = !blocksEqual(finalBlocks, blocks);

    setActiveId(null);
    setActiveWidth(null);
    setLayoutHint(null);

    orderedBlocksRef.current = finalBlocks;
    setOrderedBlocks(finalBlocks);

    if (changed && onReorder) {
      onReorder(finalBlocks);
    }
  }

  function handleDragCancel() {
    setActiveId(null);
    setActiveWidth(null);
    setLayoutHint(null);
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
    const segments = segmentBlocks(displayBlocks);

    return (
      <>
        {segments.map((segment) => {
          if (segment.type === "single") {
            const { block, index } = segment;
            return sortable ? (
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
            );
          }

          const { blocks: rowBlocks, startIndex, size } = segment;
          const rowKey = `grid-${rowBlocks.map((b) => b.id).join("-")}`;
          const colClass = gridColumnClass(rowBlocks.length, size);

          if (!sortable) {
            return (
              <div key={rowKey}>
                {editable && onInsertBlock && (
                  <InsertZone
                    index={startIndex}
                    onInsert={onInsertBlock}
                    disabled={activeId !== null}
                  />
                )}
                <div className={`product-grid-row grid ${colClass} gap-3`}>
                  {rowBlocks.map((block, rowIndex) => {
                    const index = startIndex + rowIndex;
                    return (
                      <StaticBlockItem
                        key={block.id}
                        block={block}
                        editable={editable}
                        inGrid
                        gridSize={size}
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
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div key={rowKey}>
              {editable && onInsertBlock && (
                <InsertZone
                  index={startIndex}
                  onInsert={onInsertBlock}
                  disabled={activeId !== null}
                />
              )}
              <div className={`product-grid-row grid ${colClass} gap-3`}>
                {rowBlocks.map((block, rowIndex) => {
                  const index = startIndex + rowIndex;
                  return (
                    <SortableBlockItem
                      key={block.id}
                      block={block}
                      editable={editable}
                      inGrid
                      gridSize={size}
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
                  );
                })}
              </div>
            </div>
          );
        })}
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
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {renderBlockList(true)}
      {layoutHint && activeId && (
        <LayoutDragHint hint={layoutHint} />
      )}
      <DragOverlay dropAnimation={null}>
        {activeBlock ? (
          <div
            className="cursor-grabbing opacity-90"
            style={activeWidth ? { width: activeWidth } : undefined}
          >
            <BlockPreview
              block={activeBlock}
              gridSize={(() => {
                for (const seg of segmentBlocks(displayBlocks)) {
                  if (
                    seg.type === "grid-row" &&
                    seg.blocks.some((b) => b.id === activeBlock.id)
                  ) {
                    return seg.size;
                  }
                }
                return undefined;
              })()}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function LayoutDragHint({ hint }: { hint: "row" | "stack" }) {
  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
      <div className="menu-float rounded-full px-4 py-2 text-sm text-stone-600">
        {hint === "row" ? "横並びに配置" : "縦並びに配置"}
      </div>
    </div>
  );
}

function BlockPreview({
  block,
  gridSize,
}: {
  block: Block;
  gridSize?: "compact" | "standard";
}) {
  const productLayout = gridSize ? "grid" : "inline";

  if (block.type === "divider") {
    return (
      <div className={blockClass(block.type)}>
        <BlockRenderer block={block} editable productLayout={productLayout} gridSize={gridSize} />
      </div>
    );
  }

  return (
    <div className={blockClass(block.type)}>
      <div className="min-w-0">
        <BlockRenderer block={block} editable productLayout={productLayout} gridSize={gridSize} />
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
      className={`group/insert relative h-0 ${
        disabled ? "pointer-events-none" : ""
      }`}
    >
      <div className="absolute inset-x-0 top-0 flex h-4 -translate-y-1/2 items-center justify-center">
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
    </div>
  );
}

function StaticBlockItem({
  block,
  editable,
  inGrid = false,
  gridSize,
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
  inGrid?: boolean;
  gridSize?: "compact" | "standard";
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
  const isDivider = block.type === "divider";

  return (
    <div data-block-id={block.id} className={`relative ${blockClass(block.type)}`}>
      <div className="group/block relative">
        {editable && !isDivider && (
          <div
            className={`absolute flex h-9 w-7 items-center justify-center text-stone-300 ${
              inGrid ? "-left-5 top-0" : "-left-7 top-0.5"
            }`}
            aria-hidden
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        {editable && isDivider && (
          <div
            className="pointer-events-none absolute -left-7 top-1/2 flex h-9 w-7 -translate-y-1/2 items-center justify-center text-stone-300"
            aria-hidden
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <BlockItem
          block={block}
          editable={editable}
          fullWidth={isDivider}
          inGrid={inGrid}
          gridSize={gridSize}
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
  inGrid = false,
  gridSize,
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
  inGrid?: boolean;
  gridSize?: "compact" | "standard";
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

  const isDivider = block.type === "divider";

  return (
    <div ref={setNodeRef} style={style}>
      {insertZone}
      <div
        data-block-id={block.id}
        className={`relative ${blockClass(block.type)}`}
      >
        <div className="group/block relative">
          {editable && !isDivider && (
            <button
              type="button"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              className={`absolute flex h-9 w-7 cursor-grab touch-none items-center justify-center text-stone-300 transition-colors hover:text-stone-500 active:cursor-grabbing ${
                inGrid ? "-left-5 top-0" : "-left-7 top-0.5"
              }`}
              aria-label="ドラッグして並べ替え"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          {editable && isDivider && (
            <button
              type="button"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              className="absolute -left-7 top-1/2 z-10 flex h-9 w-7 -translate-y-1/2 cursor-grab touch-none items-center justify-center text-stone-300 transition-colors hover:text-stone-500 active:cursor-grabbing"
              aria-label="ドラッグして並べ替え"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <BlockItem
            block={block}
            editable={editable}
            fullWidth={isDivider}
            inGrid={inGrid}
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
  fullWidth = false,
  inGrid = false,
  gridSize,
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
  fullWidth?: boolean;
  inGrid?: boolean;
  gridSize?: "compact" | "standard";
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
      productLayout={inGrid ? "grid" : "inline"}
      gridSize={inGrid ? gridSize : undefined}
      onUpdateBlockData={onUpdateBlockData}
      onBlockBlur={onBlockBlur}
      autoFocus={autoFocus}
    />
  );

  return (
    <>
      <div className={fullWidth ? "w-full" : "min-w-0 w-full"}>
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
        <div
          className={`absolute z-10 ${fullWidth ? "right-0 top-1/2 -translate-y-1/2" : "right-0 top-1"}`}
        >
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
              <div
                className={`menu-float absolute right-0 z-20 min-w-[140px] py-1 ${
                  fullWidth ? "top-full mt-1" : "top-8"
                }`}
              >
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
