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

type DragMode =
  | { kind: "move"; childId: string; startCol: number; startRow: number }
  | { kind: "resize"; childId: string; edge: "right" | "bottom" | "corner" }
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
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
      if (!dragMode || !dragOrigin.current) return;
      const { cellW, cellH } = cellMetrics();
      const dx = e.clientX - dragOrigin.current.x;
      const dy = e.clientY - dragOrigin.current.y;

      if (dragMode.kind === "move") {
        const deltaCol = Math.round(dx / cellW);
        const deltaRow = Math.round(dy / cellH);
        const p = dragOrigin.current.placement;
        const next = updateChildPlacement(block, dragMode.childId, {
          ...p,
          col: dragMode.startCol + deltaCol,
          row: dragMode.startRow + deltaRow,
        });
        if (next !== block) commitBento(next);
        return;
      }

      if (dragMode.kind === "resize") {
        const p = dragOrigin.current.placement;
        const deltaCol = Math.round(dx / cellW);
        const deltaRow = Math.round(dy / cellH);
        let colSpan = p.colSpan;
        let rowSpan = p.rowSpan;

        if (dragMode.edge === "right" || dragMode.edge === "corner") {
          colSpan = Math.max(
            1,
            Math.min(BENTO_COLS - p.col, p.colSpan + deltaCol),
          );
        }
        if (dragMode.edge === "bottom" || dragMode.edge === "corner") {
          rowSpan = Math.max(
            1,
            Math.min(rowCount - p.row, p.rowSpan + deltaRow),
          );
        }

        const next = updateChildPlacement(block, dragMode.childId, {
          ...p,
          colSpan,
          rowSpan,
        });
        if (next !== block) commitBento(next);
        return;
      }

      if (dragMode.kind === "bento-height") {
        const deltaRows = Math.round(dy / cellH);
        const nextRows = Math.max(2, bentoStartRows.current + deltaRows);
        commitBento(setBentoRows(block, nextRows));
      }
    },
    [block, cellMetrics, commitBento, dragMode, rowCount],
  );

  const handlePointerUp = useCallback(() => {
    if (dragMode) {
      onPersistBento?.(block.id);
    }
    setDragMode(null);
    dragOrigin.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [block.id, dragMode, handlePointerMove, onPersistBento]);

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
        bentoStartRows.current = getBentoRows(block);
      }
      setDragMode(mode);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [block, editable, handlePointerMove, handlePointerUp],
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
                      className="absolute left-1 top-1 z-20 flex h-6 w-6 cursor-grab items-center justify-center rounded bg-white/90 text-stone-400 shadow-sm active:cursor-grabbing"
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
                      className="absolute right-1 top-1 z-20 flex h-6 w-6 items-center justify-center rounded bg-white/90 text-red-500 shadow-sm"
                      aria-label="削除"
                      onClick={() => handleDeleteChild(child.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <div
                      className="absolute bottom-0 right-0 z-20 h-4 w-4 cursor-se-resize"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          {
                            kind: "resize",
                            childId: child.id,
                            edge: "corner",
                          },
                          placement,
                        )
                      }
                    />
                    <div
                      className="absolute right-0 top-1/2 z-20 h-8 w-2 -translate-y-1/2 cursor-e-resize"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          {
                            kind: "resize",
                            childId: child.id,
                            edge: "right",
                          },
                          placement,
                        )
                      }
                    />
                    <div
                      className="absolute bottom-0 left-1/2 z-20 h-2 w-8 -translate-x-1/2 cursor-s-resize"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          {
                            kind: "resize",
                            childId: child.id,
                            edge: "bottom",
                          },
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
                        gridSize="compact"
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
            {rowCount} 行 · グリッド {BENTO_COLS} 列
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
