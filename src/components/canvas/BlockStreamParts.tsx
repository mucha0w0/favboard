"use client";

import type { PairLayoutAction } from "@/lib/block-layout";
import { type Block, type BlockType } from "@/lib/types";
import {
  ArrowDown,
  ArrowUp,
  Columns2,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Rows2,
  Trash2,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { BlockRenderer } from "./BlockRenderer";

export interface BlockStreamShellProps {
  blocks: Block[];
  onEditBlock?: (block: Block) => void;
  onUpdateBlockData?: (blockId: string, data: Partial<Block["data"]>) => void;
  onBlockBlur?: (blockId: string) => void;
  focusBlockId?: string | null;
  onDeleteBlock?: (blockId: string) => void;
  onReorder?: (blocks: Block[]) => void;
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

export function BlockPreview({
  block,
  inGrid,
  gridSize,
}: {
  block: Block;
  inGrid?: boolean;
  gridSize?: "compact" | "standard";
}) {
  const productLayout =
    block.type === "product" && inGrid ? "grid" : "inline";
  const productGridSize =
    block.type === "product" && inGrid ? gridSize : undefined;

  if (block.type === "divider") {
    return (
      <div className={blockClass(block.type)}>
        <BlockRenderer
          block={block}
          editable
          productLayout={productLayout}
          gridSize={productGridSize}
        />
      </div>
    );
  }

  return (
    <div className={blockClass(block.type)}>
      <div className="min-w-0">
        <BlockRenderer
          block={block}
          editable
          productLayout={productLayout}
          gridSize={productGridSize}
        />
      </div>
    </div>
  );
}

interface BlockShellCommonProps {
  block: Block;
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
  pairLayoutActions?: PairLayoutAction[];
  onPairLayoutAction?: (blockId: string, action: PairLayoutAction) => void;
}

const PAIR_ACTION_LABELS: Record<PairLayoutAction["type"], string> = {
  "pair-row-with-prev": "上と横並び",
  "pair-row-with-next": "下と横並び",
  "stack-with-prev": "上と縦並びに戻す",
  "stack-with-next": "下と縦並びに戻す",
};

function PairLayoutMenuItems({
  blockId,
  actions,
  onPairLayoutAction,
  onClose,
}: {
  blockId: string;
  actions: PairLayoutAction[];
  onPairLayoutAction?: (blockId: string, action: PairLayoutAction) => void;
  onClose: () => void;
}) {
  if (actions.length === 0 || !onPairLayoutAction) return null;

  return (
    <>
      {actions.map((action) => {
        const isRow = action.type.startsWith("pair-row");
        const Icon = isRow ? Columns2 : Rows2;
        return (
          <button
            key={action.type}
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-600 transition-colors hover:text-stone-900"
            onClick={() => {
              onPairLayoutAction(blockId, action);
              onClose();
            }}
          >
            <Icon className="h-3.5 w-3.5" />
            {PAIR_ACTION_LABELS[action.type]}
          </button>
        );
      })}
    </>
  );
}

export function StaticBlockShell({
  block,
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
}: BlockShellCommonProps) {
  const isDivider = block.type === "divider";

  return (
    <div
      data-block-id={block.id}
      className={`relative ${blockClass(block.type)}`}
    >
      <div className="group/block relative">
        {!isDivider && (
          <div
            className={`absolute flex h-9 w-7 items-center justify-center text-stone-300 ${
              inGrid ? "-left-5 top-0" : "-left-7 top-0.5"
            }`}
            aria-hidden
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        {isDivider && (
          <div
            className="pointer-events-none absolute -left-7 top-1/2 flex h-9 w-7 -translate-y-1/2 items-center justify-center text-stone-300"
            aria-hidden
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <BlockItem
          block={block}
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

export function SortableBlockShell({
  block,
  className = "",
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
  pairLayoutActions = [],
  onPairLayoutAction,
}: BlockShellCommonProps & { className?: string }) {
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
    animateLayoutChanges: ({ isSorting }) => !isSorting,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    position: "relative" as const,
  };

  const isDivider = block.type === "divider";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${
        isDragging
          ? "rounded-sm border border-dashed border-stone-200 bg-stone-50/50"
          : ""
      }`}
    >
      <div
        data-block-id={block.id}
        className={`relative ${blockClass(block.type)}`}
        style={isDragging ? { opacity: 0 } : undefined}
      >
        <div className="group/block relative">
          {!isDivider && (
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
          {isDivider && (
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
            pairLayoutActions={pairLayoutActions}
            onPairLayoutAction={onPairLayoutAction}
          />
        </div>
      </div>
    </div>
  );
}

function BlockItem({
  block,
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
  pairLayoutActions = [],
  onPairLayoutAction,
}: BlockShellCommonProps & { fullWidth?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleDelete() {
    if (!onDeleteBlock) return;
    const label = TYPE_LABELS[block.type];
    if (!confirm(`この${label}を削除しますか？`)) return;
    onDeleteBlock(block.id);
    setMenuOpen(false);
  }

  const isProductClickable = block.type === "product";

  const content = (
    <BlockRenderer
      block={block}
      editable
      productLayout={
        block.type === "product" && inGrid ? "grid" : "inline"
      }
      gridSize={block.type === "product" && inGrid ? gridSize : undefined}
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
              <PairLayoutMenuItems
                blockId={block.id}
                actions={pairLayoutActions}
                onPairLayoutAction={onPairLayoutAction}
                onClose={() => setMenuOpen(false)}
              />
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
    </>
  );
}
