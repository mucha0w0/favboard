"use client";

import {
  BENTO_COLS,
  addBentoChild,
  createBentoChild,
  getBentoChildren,
  getBentoRows,
  getChildPlacement,
  placementStyle,
  removeBentoChild,
  setBentoRows,
  updateChildPlacement,
  updateBentoChildData,
} from "@/lib/bento-layout";
import type { BentoCellPlacement, Block, BlockData } from "@/lib/types";
import { AlignLeft, GripHorizontal, Package, Plus, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { BlockRenderer } from "../BlockRenderer";

interface BentoBlockProps {
  block: Block;
  editable?: boolean;
  focusBlockId?: string | null;
  onUpdateBento?: (bentoId: string, data: Partial<BlockData>) => void;
  onEditChild?: (bentoId: string, child: Block) => void;
  onChildBlur?: (bentoId: string, childId: string) => void;
  onPersistBento?: (bentoId: string) => void;
}

type ResizeEdge =
  | "right"
  | "bottom"
  | "left"
  | "top"
  | "se"
  | "sw"
  | "ne"
  | "nw";

type DragMode =
  | { kind: "move"; childId: string; startCol: number; startRow: number }
  | { kind: "resize"; childId: string; edge: ResizeEdge }
  | { kind: "bento-height" };

export function BentoBlock({
  block,
  editable = false,
  focusBlockId,
  onUpdateBento,
  onEditChild,
  onChildBlur,
  onPersistBento,
}: BentoBlockProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef(block);
  blockRef.current = block;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragModeRef = useRef<DragMode | null>(null);
  const dragOrigin = useRef<{
    x: number;
    y: number;
    placement: BentoCellPlacement;
  } | null>(null);
  const bentoStartRows = useRef(0);

  const children = getBentoChildren(block);
  const rowCount = getBentoRows(block);

  const commitBento = useCallback(
    (next: Block) => {
      onUpdateBento?.(block.id, next.data);
    },
    [block.id, onUpdateBento],
  );

  const cellMetrics = useCallback(() => {
    const el = gridRef.current;
    if (!el) return { cellW: 1, cellH: 1 };
    const rect = el.getBoundingClientRect();
    return {
      cellW: rect.width / BENTO_COLS,
      cellH: rect.height / rowCount,
    };
  }, [rowCount]);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const mode = dragModeRef.current;
      if (!mode || !dragOrigin.current) return;

      const currentBlock = blockRef.current;
      const { cellW, cellH } = cellMetrics();
      const dx = e.clientX - dragOrigin.current.x;
      const dy = e.clientY - dragOrigin.current.y;

      if (mode.kind === "move") {
        const deltaCol = Math.round(dx / cellW);
        const deltaRow = Math.round(dy / cellH);
        const p = dragOrigin.current.placement;
        const next = updateChildPlacement(currentBlock, mode.childId, {
          ...p,
          col: mode.startCol + deltaCol,
          row: mode.startRow + deltaRow,
        });
        if (next !== currentBlock) commitBento(next);
        return;
      }

      if (mode.kind === "resize") {
        const startP = dragOrigin.current.placement;
        const deltaCol = Math.round(dx / cellW);
        const deltaRow = Math.round(dy / cellH);
        const edge = mode.edge;

        let col = startP.col;
        let row = startP.row;
        let colSpan = startP.colSpan;
        let rowSpan = startP.rowSpan;

        const affectsRight =
          edge === "right" || edge === "se" || edge === "ne";
        const affectsLeft =
          edge === "left" || edge === "sw" || edge === "nw";
        const affectsBottom =
          edge === "bottom" || edge === "se" || edge === "sw";
        const affectsTop = edge === "top" || edge === "ne" || edge === "nw";

        if (affectsRight) {
          colSpan = Math.max(
            1,
            Math.min(BENTO_COLS - startP.col, startP.colSpan + deltaCol),
          );
        }
        if (affectsLeft) {
          col = Math.max(
            0,
            Math.min(
              startP.col + startP.colSpan - 1,
              startP.col + deltaCol,
            ),
          );
          colSpan = startP.col + startP.colSpan - col;
          colSpan = Math.max(
            1,
            Math.min(BENTO_COLS - col, colSpan),
          );
        }
        if (affectsBottom) {
          rowSpan = Math.max(1, startP.rowSpan + deltaRow);
        }
        if (affectsTop) {
          row = Math.max(
            0,
            Math.min(
              startP.row + startP.rowSpan - 1,
              startP.row + deltaRow,
            ),
          );
          rowSpan = startP.row + startP.rowSpan - row;
          rowSpan = Math.max(1, rowSpan);
        }

        const next = updateChildPlacement(currentBlock, mode.childId, {
          col,
          row,
          colSpan,
          rowSpan,
        });
        if (next !== currentBlock) commitBento(next);
        return;
      }

      if (mode.kind === "bento-height") {
        const deltaRows = Math.round(dy / cellH);
        const nextRows = Math.max(2, bentoStartRows.current + deltaRows);
        commitBento(setBentoRows(currentBlock, nextRows));
      }
    },
    [cellMetrics, commitBento],
  );

  const handlePointerUp = useCallback(() => {
    if (dragModeRef.current) {
      onPersistBento?.(blockRef.current.id);
    }
    dragModeRef.current = null;
    dragOrigin.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove, onPersistBento]);

  const startDrag = useCallback(
    (
      e: React.PointerEvent,
      mode: DragMode,
      placement: BentoCellPlacement,
    ) => {
      if (!editable) return;
      e.preventDefault();
      e.stopPropagation();
      if ("childId" in mode) setSelectedId(mode.childId);
      dragOrigin.current = { x: e.clientX, y: e.clientY, placement };
      if (mode.kind === "bento-height") {
        bentoStartRows.current = getBentoRows(blockRef.current);
      }
      dragModeRef.current = mode;
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [editable, handlePointerMove, handlePointerUp],
  );

  function handleAddChild(type: "product" | "text") {
    const child = createBentoChild(type);
    const next = addBentoChild(block, child);
    commitBento(next);
    setSelectedId(child.id);
    onPersistBento?.(block.id);
  }

  function handleDeleteChild(childId: string) {
    if (!confirm("このアイテムを削除しますか？")) return;
    commitBento(removeBentoChild(block, childId));
    if (selectedId === childId) setSelectedId(null);
    onPersistBento?.(block.id);
  }

  return (
    <div>
      <div className="relative">
        {editable && (
          <div
            className="pointer-events-none absolute inset-0 grid gap-1.5 p-2"
            style={{
              gridTemplateColumns: `repeat(${BENTO_COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rowCount}, minmax(3rem, 1fr))`,
            }}
            aria-hidden
          >
            {Array.from({ length: rowCount * BENTO_COLS }).map((_, i) => (
              <div
                key={i}
                className="rounded-sm border border-dashed border-stone-200/60 bg-stone-50/50"
              />
            ))}
          </div>
        )}

        <div
          ref={gridRef}
          className="relative grid gap-1.5 rounded-lg border border-stone-200/80 bg-stone-100/20 p-2"
          style={{
            gridTemplateColumns: `repeat(${BENTO_COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rowCount}, minmax(3rem, 1fr))`,
            minHeight: `${rowCount * 3}rem`,
          }}
          onClick={() => editable && setSelectedId(null)}
        >
          {children.map((child) => {
            const placement = getChildPlacement(block, child.id);
            const isSelected = selectedId === child.id;
            const style = placementStyle(placement);

            return (
              <div
                key={child.id}
                className={`relative min-h-0 min-w-0 overflow-hidden rounded-md bg-white shadow-sm ring-1 ${
                  isSelected && editable
                    ? "ring-stone-400"
                    : "ring-stone-200/60"
                }`}
                style={style}
                onClick={(e) => {
                  e.stopPropagation();
                  if (editable) setSelectedId(child.id);
                }}
              >
                {editable && isSelected && (
                  <>
                    <button
                      type="button"
                      className="absolute left-1 top-1 z-30 flex h-6 w-6 cursor-grab items-center justify-center rounded bg-white/90 text-stone-400 shadow-sm active:cursor-grabbing"
                      aria-label="移動"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          {
                            kind: "move",
                            childId: child.id,
                            startCol: placement.col,
                            startRow: placement.row,
                          },
                          placement,
                        )
                      }
                    >
                      <GripHorizontal className="h-3.5 w-3.5 rotate-90" />
                    </button>
                    <button
                      type="button"
                      className="absolute right-1 top-1 z-30 flex h-6 w-6 items-center justify-center rounded bg-white/90 text-red-500 shadow-sm"
                      aria-label="削除"
                      onClick={() => handleDeleteChild(child.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    {/* 四辺リサイズ */}
                    <div
                      className="absolute inset-y-2 left-0 z-20 w-2 cursor-w-resize"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          { kind: "resize", childId: child.id, edge: "left" },
                          placement,
                        )
                      }
                    />
                    <div
                      className="absolute inset-x-2 top-0 z-20 flex h-3 cursor-n-resize touch-none items-start justify-center"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          { kind: "resize", childId: child.id, edge: "top" },
                          placement,
                        )
                      }
                    >
                      <span className="mt-0.5 h-1 w-8 rounded-full bg-stone-300/80" />
                    </div>
                    <div
                      className="absolute inset-y-2 right-0 z-20 w-2 cursor-e-resize"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          { kind: "resize", childId: child.id, edge: "right" },
                          placement,
                        )
                      }
                    />
                    <div
                      className="absolute inset-x-2 bottom-0 z-20 flex h-3 cursor-s-resize touch-none items-end justify-center"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          { kind: "resize", childId: child.id, edge: "bottom" },
                          placement,
                        )
                      }
                    >
                      <span className="mb-0.5 h-1 w-8 rounded-full bg-stone-300/80" />
                    </div>
                    {/* 四隅リサイズ */}
                    <div
                      className="absolute left-0 top-0 z-20 h-3 w-3 cursor-nw-resize"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          { kind: "resize", childId: child.id, edge: "nw" },
                          placement,
                        )
                      }
                    />
                    <div
                      className="absolute right-0 top-0 z-20 h-3 w-3 cursor-ne-resize"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          { kind: "resize", childId: child.id, edge: "ne" },
                          placement,
                        )
                      }
                    />
                    <div
                      className="absolute bottom-0 left-0 z-20 h-3 w-3 cursor-sw-resize"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          { kind: "resize", childId: child.id, edge: "sw" },
                          placement,
                        )
                      }
                    />
                    <div
                      className="absolute bottom-0 right-0 z-20 h-3 w-3 cursor-se-resize"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          { kind: "resize", childId: child.id, edge: "se" },
                          placement,
                        )
                      }
                    />
                  </>
                )}

                <div className="h-full overflow-auto p-2">
                  {child.type === "product" ? (
                    <button
                      type="button"
                      className="h-full w-full text-left"
                      onClick={() => editable && onEditChild?.(block.id, child)}
                    >
                      <BlockRenderer
                        block={child}
                        editable={editable}
                        productLayout="grid"
                        cellSpan={{
                          colSpan: placement.colSpan,
                          rowSpan: placement.rowSpan,
                        }}
                      />
                    </button>
                  ) : (
                    <BlockRenderer
                      block={child}
                      editable={editable}
                      autoFocus={focusBlockId === child.id}
                      onUpdateBlockData={(_, data) => {
                        commitBento(updateBentoChildData(block, child.id, data));
                      }}
                      onBlockBlur={() => onChildBlur?.(block.id, child.id)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editable && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
            onClick={() => handleAddChild("product")}
          >
            <Plus className="h-3 w-3" />
            <Package className="h-3 w-3" />
            商品
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
            onClick={() => handleAddChild("text")}
          >
            <Plus className="h-3 w-3" />
            <AlignLeft className="h-3 w-3" />
            テキスト
          </button>
          <span className="text-xs text-stone-400">
            {rowCount} 行 · グリッド {BENTO_COLS} 列 ·
            選択中のアイテムは上下の端をドラッグして縦幅を変更
          </span>
        </div>
      )}

      {editable && (
        <div
          className="mx-auto mt-1 flex h-4 w-16 cursor-ns-resize items-center justify-center rounded-full text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-500"
          aria-label="Bento の高さを調整"
          onPointerDown={(e) =>
            startDrag(
              e,
              { kind: "bento-height" },
              { col: 0, row: 0, colSpan: 1, rowSpan: 1 },
            )
          }
        >
          <GripHorizontal className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
