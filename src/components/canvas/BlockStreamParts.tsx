"use client";

import { type Block, type BlockData, type TopLevelBlockType } from "@/lib/types";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type ReactNode } from "react";
import { BlockRenderer } from "./BlockRenderer";

export interface BlockStreamShellProps {
  blocks: Block[];
  onEditBlock?: (
    block: Block,
    context?: { bentoId: string; isNew?: boolean },
  ) => void;
  onUpdateBlockData?: (blockId: string, data: Partial<BlockData>) => void;
  onBlockBlur?: (blockId: string) => void;
  focusBlockId?: string | null;
  onDeleteBlock?: (blockId: string) => void;
  onReorder?: (blocks: Block[]) => void;
  onUpdateBento?: (bentoId: string, data: Partial<BlockData>) => void;
  onBentoChildBlur?: (bentoId: string, childId: string) => void;
  onPersistBento?: (bentoId: string) => void;
}

const TYPE_LABELS: Record<TopLevelBlockType, string> = {
  bento: "Bento",
  heading: "見出し",
  text: "テキスト",
  divider: "区切り線",
};

function blockClass(type: Block["type"]): string {
  switch (type) {
    case "heading":
      return "block-heading";
    case "text":
      return "block-text";
    case "bento":
      return "block-bento";
    case "divider":
      return "block-divider";
    default:
      return "";
  }
}

export function BlockPreview({ block }: { block: Block }) {
  return (
    <div className={blockClass(block.type)}>
      <BlockRenderer block={block} editable />
    </div>
  );
}

interface BlockShellCommonProps {
  block: Block;
  className?: string;
  /** When false, hide grips, menus, and pass read-only to BlockRenderer. */
  editable?: boolean;
  onEditBlock?: (
    block: Block,
    context?: { bentoId: string; isNew?: boolean },
  ) => void;
  onUpdateBlockData?: (blockId: string, data: Partial<BlockData>) => void;
  onBlockBlur?: (blockId: string) => void;
  focusBlockId?: string | null;
  onDeleteBlock?: (blockId: string) => void;
  onUpdateBento?: (bentoId: string, data: Partial<BlockData>) => void;
  onBentoChildBlur?: (bentoId: string, childId: string) => void;
  onPersistBento?: (bentoId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function GripSlot({
  isDivider,
  children,
}: {
  isDivider: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={
        isDivider
          ? "absolute -left-7 top-1/2 z-10 flex h-9 w-7 -translate-y-1/2 items-center justify-center text-stone-300"
          : "absolute -left-7 top-0.5 flex h-9 w-7 items-center justify-center text-stone-300"
      }
    >
      {children}
    </div>
  );
}

function BlockShellFrame({
  block,
  className,
  grip,
  editable = false,
  ...itemProps
}: BlockShellCommonProps & { grip: ReactNode }) {
  const isDivider = block.type === "divider";

  return (
    <div
      data-block-id={block.id}
      className={`relative ${blockClass(block.type)} ${className ?? ""}`}
    >
      <div className="group/block relative">
        {editable && <GripSlot isDivider={isDivider}>{grip}</GripSlot>}
        <BlockItem
          {...itemProps}
          block={block}
          editable={editable}
          fullWidth={isDivider}
        />
      </div>
    </div>
  );
}

export function StaticBlockShell(props: BlockShellCommonProps) {
  return (
    <BlockShellFrame
      {...props}
      grip={<GripVertical className="h-4 w-4" aria-hidden />}
    />
  );
}

export function SortableBlockShell(props: BlockShellCommonProps) {
  const { block, className = "" } = props;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      data-sortable-id={block.id}
    >
      {isDragging ? (
        <div className="flex items-center py-5" aria-hidden>
          <div className="h-0.5 w-full rounded-full bg-black" />
        </div>
      ) : (
        <BlockShellFrame
          {...props}
          editable
          className=""
          grip={
            <button
              type="button"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              className="flex h-9 w-7 cursor-grab touch-none items-center justify-center text-stone-300 transition-colors hover:text-stone-500 active:cursor-grabbing"
              aria-label="ドラッグして並べ替え"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          }
        />
      )}
    </div>
  );
}

function BlockItem({
  block,
  fullWidth = false,
  editable = false,
  onEditBlock,
  onUpdateBlockData,
  onBlockBlur,
  focusBlockId,
  onDeleteBlock,
  onUpdateBento,
  onBentoChildBlur,
  onPersistBento,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: BlockShellCommonProps & { fullWidth?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (block.type === "product") {
    return null;
  }

  function handleDelete() {
    if (!onDeleteBlock) return;
    const label = TYPE_LABELS[block.type as TopLevelBlockType] ?? "ブロック";
    if (!confirm(`この${label}を削除しますか？`)) return;
    onDeleteBlock(block.id);
    setMenuOpen(false);
  }

  const content = (
    <BlockRenderer
      block={block}
      editable={editable}
      focusBlockId={focusBlockId}
      autoFocus={editable && focusBlockId === block.id}
      onUpdateBlockData={onUpdateBlockData}
      onBlockBlur={onBlockBlur}
      onUpdateBento={onUpdateBento}
      onEditBentoChild={(bentoId, child, opts) =>
        onEditBlock?.(child, { bentoId, isNew: opts?.isNew })
      }
      onBentoChildBlur={onBentoChildBlur}
      onPersistBento={onPersistBento}
    />
  );

  return (
    <>
      <div className={fullWidth ? "w-full" : "min-w-0 w-full"}>{content}</div>

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
