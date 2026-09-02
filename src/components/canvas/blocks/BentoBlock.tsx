"use client";

import {
  BENTO_COLS,
  addBentoChild,
  bentoGridStyle,
  createBentoChild,
  getBentoChildren,
  getBentoRows,
  getChildPlacement,
  measureBentoCellSize,
  MIN_BENTO_ROWS,
  placementStyle,
  previewChildPlacement,
  removeBentoChild,
  requiredBentoRows,
  setBentoRows,
  updateChildPlacement,
  updateBentoChildData,
} from "@/lib/bento-layout";
import type { BentoCellPlacement, Block, BlockData } from "@/lib/types";
import { AlignLeft, GripHorizontal, Package, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

type DragPreview = {
  childId?: string;
  placement?: BentoCellPlacement;
  bentoRows?: number;
  blocked?: boolean;
};

type DragOrigin = {
  x: number;
  y: number;
  placement: BentoCellPlacement;
  cellW: number;
  cellH: number;
};

function computeCellMetrics(el: HTMLElement): { cellW: number; cellH: number } {
  const cellW = measureBentoCellSize(el);
  return { cellW, cellH: cellW };
}

function computePlacementFromDrag(
  mode: DragMode,
  origin: DragOrigin,
  dx: number,
  dy: number,
): DragPreview | null {
  const { cellW, cellH, placement: startP } = origin;
  const deltaCol = Math.round(dx / cellW);
  const deltaRow = Math.round(dy / cellH);

  if (mode.kind === "move") {
    return {
      childId: mode.childId,
      placement: {
        ...startP,
        col: mode.startCol + deltaCol,
        row: mode.startRow + deltaRow,
      },
    };
  }

  if (mode.kind === "resize") {
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
        Math.min(startP.col + startP.colSpan - 1, startP.col + deltaCol),
      );
      colSpan = startP.col + startP.colSpan - col;
      colSpan = Math.max(1, Math.min(BENTO_COLS - col, colSpan));
    }
    if (affectsBottom) {
      rowSpan = Math.max(1, startP.rowSpan + deltaRow);
    }
    if (affectsTop) {
      row = Math.max(
        0,
        Math.min(startP.row + startP.rowSpan - 1, startP.row + deltaRow),
      );
      rowSpan = startP.row + startP.rowSpan - row;
      rowSpan = Math.max(1, rowSpan);
    }

    return {
      childId: mode.childId,
      placement: { col, row, colSpan, rowSpan },
    };
  }

  return null;
}

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
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const dragPreviewRef = useRef<DragPreview | null>(null);

  const dragModeRef = useRef<DragMode | null>(null);
  const dragOrigin = useRef<DragOrigin | null>(null);
  const bentoStartRows = useRef(0);
  const captureTarget = useRef<HTMLElement | null>(null);
  const capturePointerId = useRef<number | null>(null);
  const didDragRef = useRef(false);

  const children = getBentoChildren(block);
  const rowCount = dragPreview?.bentoRows ?? getBentoRows(block);

  const commitBento = useCallback(
    (next: Block) => {
      onUpdateBento?.(block.id, next.data);
    },
    [block.id, onUpdateBento],
  );

  const endDrag = useCallback(() => {
    if (captureTarget.current && capturePointerId.current !== null) {
      try {
        captureTarget.current.releasePointerCapture(capturePointerId.current);
      } catch {
        /* already released */
      }
    }
    captureTarget.current = null;
    capturePointerId.current = null;
    document.body.style.userSelect = "";
    document.body.style.touchAction = "";
    dragModeRef.current = null;
    dragOrigin.current = null;
  }, []);

  const handlePointerMoveRef = useRef<(e: PointerEvent) => void>(() => {});
  const handlePointerUpRef = useRef<(e: PointerEvent) => void>(() => {});

  function applyDragPreview(preview: DragPreview | null) {
    dragPreviewRef.current = preview;
    setDragPreview(preview);
  }

  handlePointerMoveRef.current = (e: PointerEvent) => {
    const mode = dragModeRef.current;
    const origin = dragOrigin.current;
    if (!mode || !origin) return;

    const dx = e.clientX - origin.x;
    const dy = e.clientY - origin.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      didDragRef.current = true;
    }

    if (mode.kind === "bento-height") {
      const deltaRows = Math.round(dy / origin.cellH);
      const minRows = Math.max(
        MIN_BENTO_ROWS,
        requiredBentoRows(blockRef.current),
      );
      const nextRows = Math.max(minRows, bentoStartRows.current + deltaRows);
      applyDragPreview({ bentoRows: nextRows });
      return;
    }

    if (gridRef.current) {
      const metrics = computeCellMetrics(gridRef.current);
      origin.cellW = metrics.cellW;
      origin.cellH = metrics.cellH;
    }

    const preview = computePlacementFromDrag(mode, origin, dx, dy);
    if (!preview?.placement || !preview.childId) return;

    const currentBlock = blockRef.current;
    const expandRows = mode.kind === "move";
    const resolved = previewChildPlacement(
      currentBlock,
      preview.childId,
      preview.placement,
      { expandRows },
    );

    applyDragPreview({
      childId: preview.childId,
      placement: resolved.placement,
      bentoRows: resolved.bentoRows,
      blocked: resolved.blocked,
    });
  };

  handlePointerUpRef.current = () => {
    const mode = dragModeRef.current;
    const preview = dragPreviewRef.current;

    if (mode && preview) {
      const currentBlock = blockRef.current;
      let nextBlock = currentBlock;

      if (mode.kind === "bento-height" && preview.bentoRows != null) {
        nextBlock = setBentoRows(currentBlock, preview.bentoRows);
      } else if (
        preview.childId &&
        preview.placement &&
        (mode.kind === "move" || mode.kind === "resize") &&
        !preview.blocked
      ) {
        nextBlock = updateChildPlacement(
          currentBlock,
          preview.childId,
          preview.placement,
          { expandRows: mode.kind === "move" },
        );
      }

      if (nextBlock !== currentBlock) {
        commitBento(nextBlock);
      }
      onPersistBento?.(currentBlock.id);
    }

    applyDragPreview(null);
    endDrag();
    window.removeEventListener("pointermove", stablePointerMove);
    window.removeEventListener("pointerup", stablePointerUp);
    window.removeEventListener("pointercancel", stablePointerUp);
  };

  const stablePointerMove = useCallback((e: PointerEvent) => {
    handlePointerMoveRef.current(e);
  }, []);

  const stablePointerUp = useCallback((e: PointerEvent) => {
    handlePointerUpRef.current(e);
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", stablePointerMove);
      window.removeEventListener("pointerup", stablePointerUp);
      window.removeEventListener("pointercancel", stablePointerUp);
      endDrag();
    };
  }, [stablePointerMove, stablePointerUp, endDrag]);

  const startDrag = useCallback(
    (
      e: React.PointerEvent,
      mode: DragMode,
      placement: BentoCellPlacement,
    ) => {
      if (!editable || !gridRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      didDragRef.current = false;
      if ("childId" in mode) setSelectedId(mode.childId);

      const metrics = computeCellMetrics(gridRef.current);
      dragOrigin.current = {
        x: e.clientX,
        y: e.clientY,
        placement,
        cellW: metrics.cellW,
        cellH: metrics.cellH,
      };

      if (mode.kind === "bento-height") {
        bentoStartRows.current = getBentoRows(blockRef.current);
        dragOrigin.current.placement = {
          ...placement,
          rowSpan: bentoStartRows.current,
        };
      }

      dragModeRef.current = mode;

      const target = e.currentTarget as HTMLElement;
      captureTarget.current = target;
      capturePointerId.current = e.pointerId;
      target.setPointerCapture(e.pointerId);
      document.body.style.userSelect = "none";
      document.body.style.touchAction = "none";

      window.addEventListener("pointermove", stablePointerMove);
      window.addEventListener("pointerup", stablePointerUp);
      window.addEventListener("pointercancel", stablePointerUp);
    },
    [editable, stablePointerMove, stablePointerUp],
  );

  function getDisplayPlacement(childId: string): BentoCellPlacement {
    if (
      dragPreview?.childId === childId &&
      dragPreview.placement
    ) {
      return dragPreview.placement;
    }
    return getChildPlacement(block, childId);
  }

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
            className="bento-grid pointer-events-none absolute inset-0 grid gap-1 p-1.5"
            style={bentoGridStyle(rowCount)}
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
          className="bento-grid relative grid gap-1 rounded-lg border border-stone-200/80 bg-stone-100/20 p-1.5"
          style={bentoGridStyle(rowCount)}
          onClick={() => editable && setSelectedId(null)}
        >
          {children.map((child) => {
            const placement = getDisplayPlacement(child.id);
            const isSelected = selectedId === child.id;
            const style = placementStyle(placement);
            const isDragging =
              dragPreview?.childId === child.id && dragPreview.placement;
            const isBlocked =
              isDragging && dragPreview?.blocked === true;

            return (
              <div
                key={child.id}
                className={`relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md bg-white shadow-sm ring-1 ${
                  isBlocked
                    ? "ring-red-300"
                    : isSelected && editable
                      ? "ring-stone-400"
                      : "ring-stone-200/60"
                } ${isDragging ? "z-10 opacity-90" : ""}`}
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
                      className="absolute left-1 top-1 z-30 flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded bg-white/90 text-stone-400 shadow-sm active:cursor-grabbing"
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
                      className="absolute inset-y-2 left-0 z-20 w-2 cursor-w-resize touch-none"
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
                      className="absolute inset-y-2 right-0 z-20 w-2 cursor-e-resize touch-none"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          { kind: "resize", childId: child.id, edge: "right" },
                          placement,
                        )
                      }
                    />
                    {/* 上辺・上隅のみ（下方向リサイズ不可） */}
                    <div
                      className="absolute left-0 top-0 z-20 h-4 w-4 cursor-nw-resize touch-none"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          { kind: "resize", childId: child.id, edge: "nw" },
                          placement,
                        )
                      }
                    />
                    <div
                      className="absolute right-0 top-0 z-20 h-4 w-4 cursor-ne-resize touch-none"
                      onPointerDown={(e) =>
                        startDrag(
                          e,
                          { kind: "resize", childId: child.id, edge: "ne" },
                          placement,
                        )
                      }
                    />
                  </>
                )}

                <div
                  className={`pointer-events-none flex min-h-0 flex-1 flex-col overflow-hidden **:pointer-events-auto ${
                    child.type === "product"
                      ? placement.colSpan * placement.rowSpan <= 4
                        ? "p-1"
                        : placement.colSpan * placement.rowSpan <= 9
                          ? "p-1.5"
                          : "p-2"
                      : "p-1.5"
                  }`}
                >
                  {child.type === "product" ? (
                    <button
                      type="button"
                      className="h-full w-full touch-none text-left"
                      onClick={() => {
                        if (didDragRef.current) {
                          didDragRef.current = false;
                          return;
                        }
                        if (editable) onEditChild?.(block.id, child);
                      }}
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
                        commitBento(
                          updateBentoChildData(
                            blockRef.current,
                            child.id,
                            data,
                          ),
                        );
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
            下のグリップで Bento の縦幅を変更
          </span>
        </div>
      )}

      {editable && (
        <div
          className="mx-auto mt-1 flex h-4 w-16 cursor-ns-resize touch-none items-center justify-center rounded-full text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-500"
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
