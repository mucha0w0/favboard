"use client";

import {
  BENTO_COLS,
  addBentoChild,
  bentoGridStyle,
  createBentoChild,
  getBentoChildren,
  getBentoRows,
  getChildPlacement,
  placementStyle,
  removeBentoChild,
  updateBentoChildData,
} from "@/lib/bento";
import type { Block, BlockData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AlignLeft, Package, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BentoChildChrome } from "../bento/BentoChildChrome";
import { BentoChildRenderer } from "../bento/BentoChildRenderer";
import { useBentoPointerDrag } from "../bento/useBentoPointerDrag";

interface BentoBlockProps {
  block: Block;
  editable?: boolean;
  focusBlockId?: string | null;
  onUpdateBento?: (bentoId: string, data: Partial<BlockData>) => void;
  onEditChild?: (
    bentoId: string,
    child: Block,
    opts?: { isNew?: boolean },
  ) => void;
  onChildBlur?: (bentoId: string, childId: string) => void;
  onPersistBento?: (bentoId: string) => void;
}

function ChildBody({
  child,
  editable,
  placement,
  focusBlockId,
  blockId,
  blockRef,
  commitBento,
  onChildBlur,
}: {
  child: Block;
  editable: boolean;
  placement: { colSpan: number; rowSpan: number };
  focusBlockId?: string | null;
  blockId: string;
  blockRef: React.MutableRefObject<Block>;
  commitBento: (next: Block) => void;
  onChildBlur?: (bentoId: string, childId: string) => void;
}) {
  const area = placement.colSpan * placement.rowSpan;
  const pad =
    child.type === "product"
      ? area <= 16
        ? "p-1"
        : area <= 36
          ? "p-1.5"
          : "p-2"
      : "p-1.5";

  return (
    <div
      className={`pointer-events-none flex min-h-0 flex-1 flex-col overflow-hidden **:pointer-events-auto ${pad}`}
    >
      {child.type === "product" ? (
        <div className="h-full w-full text-left">
          <BentoChildRenderer
            block={child}
            editable={editable}
            cellSpan={{
              colSpan: placement.colSpan,
              rowSpan: placement.rowSpan,
            }}
          />
        </div>
      ) : (
        <BentoChildRenderer
          block={child}
          editable={editable}
          autoFocus={focusBlockId === child.id}
          onUpdateBlockData={(_, data) => {
            commitBento(
              updateBentoChildData(blockRef.current, child.id, data),
            );
          }}
          onBlockBlur={() => onChildBlur?.(blockId, child.id)}
        />
      )}
    </div>
  );
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
  useEffect(() => {
    blockRef.current = block;
  }, [block]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const commitBento = useCallback(
    (next: Block) => {
      onUpdateBento?.(block.id, next.data);
    },
    [block.id, onUpdateBento],
  );

  const { dragVisual, startDrag } = useBentoPointerDrag({
    editable,
    blockRef,
    gridRef,
    onCommit: commitBento,
    onPersist: () => onPersistBento?.(block.id),
  });

  const children = getBentoChildren(block);
  const rowCount = dragVisual?.bentoRows ?? getBentoRows(block);
  const draggingChildId =
    dragVisual?.kind === "child" ? dragVisual.childId : undefined;

  function handleAddChild(type: "product" | "text") {
    const child = createBentoChild(type);
    const next = addBentoChild(block, child);
    commitBento(next);
    setSelectedId(child.id);
    onPersistBento?.(block.id);
    if (type === "product") {
      onEditChild?.(block.id, child, { isNew: true });
    }
  }

  function handleDeleteChild(childId: string) {
    if (!confirm("このアイテムを削除しますか？")) return;
    commitBento(removeBentoChild(block, childId));
    if (selectedId === childId) setSelectedId(null);
    onPersistBento?.(block.id);
  }

  return (
    <div>
      {editable && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddChild("product")}
          >
            <Plus className="h-3 w-3" />
            <Package className="h-3 w-3" />
            商品
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddChild("text")}
          >
            <Plus className="h-3 w-3" />
            <AlignLeft className="h-3 w-3" />
            テキスト
          </Button>
        </div>
      )}

      <div className="bento-grid-host relative">
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
          className={`bento-grid relative grid gap-1 rounded-sm p-1.5 ${
            editable ? "bg-stone-100/30" : ""
          }`}
          style={bentoGridStyle(rowCount)}
          onClick={() => editable && setSelectedId(null)}
        >
          {children.map((child) => {
            const placement = getChildPlacement(block, child.id);
            const isSelected = selectedId === child.id;
            const isDragging = draggingChildId === child.id;
            const style = placementStyle(placement);

            return (
              <div
                key={child.id}
                className={`relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-sm bg-stone-50/90 ring-1 ${
                  isSelected && editable
                    ? "ring-stone-400"
                    : "ring-stone-200/50"
                }`}
                style={style}
                onClick={(e) => {
                  e.stopPropagation();
                  if (editable) setSelectedId(child.id);
                }}
              >
                {editable && isSelected && !isDragging && (
                  <BentoChildChrome
                    onStartMove={(e) => {
                      setSelectedId(child.id);
                      startDrag(
                        e,
                        { kind: "move", childId: child.id },
                        placement,
                      );
                    }}
                    onStartResize={(e, edge) => {
                      setSelectedId(child.id);
                      startDrag(
                        e,
                        { kind: "resize", childId: child.id, edge },
                        placement,
                      );
                    }}
                    onDelete={() => handleDeleteChild(child.id)}
                    showEdit={child.type === "product"}
                    onEdit={() => onEditChild?.(block.id, child)}
                  />
                )}

                <ChildBody
                  child={child}
                  editable={editable}
                  placement={placement}
                  focusBlockId={focusBlockId}
                  blockId={block.id}
                  blockRef={blockRef}
                  commitBento={commitBento}
                  onChildBlur={onChildBlur}
                />
              </div>
            );
          })}

          {/* スナップ先ゴースト */}
          {dragVisual?.kind === "child" && dragVisual.snap && (
            <div
              className={`pointer-events-none z-10 rounded-sm border border-dashed ${
                dragVisual.blocked
                  ? "border-red-400/80 bg-red-50/40"
                  : "border-stone-400/80 bg-stone-900/5"
              }`}
              style={placementStyle(dragVisual.snap)}
            />
          )}
        </div>
      </div>

      {editable && (
        <div
          className="mx-auto mt-1 flex h-4 w-16 cursor-ns-resize touch-none items-center justify-center rounded-full transition-colors hover:bg-stone-100"
          aria-label="Bento の高さを調整"
          onPointerDown={(e) =>
            startDrag(
              e,
              { kind: "bento-height" },
              { col: 0, row: 0, colSpan: 1, rowSpan: 1 },
            )
          }
        >
          <span className="h-0.5 w-8 rounded-full bg-stone-400/70" />
        </div>
      )}
    </div>
  );
}
