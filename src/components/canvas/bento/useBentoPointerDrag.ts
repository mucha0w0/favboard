"use client";

import {
  type DragMode,
  type DragOrigin,
  computePlacementFromDrag,
  deltaGridUnits,
  getBentoRows,
  measureBentoGridStepFromDOM,
  MIN_BENTO_ROWS,
  previewChildPlacement,
  requiredBentoRows,
  setBentoRows,
  updateChildPlacement,
} from "@/lib/bento";
import type { BentoCellPlacement, Block } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

type DragPreview = {
  childId?: string;
  placement?: BentoCellPlacement;
  bentoRows?: number;
  blocked?: boolean;
};

export function useBentoPointerDrag({
  editable,
  blockRef,
  gridRef,
  ghostGridRef,
  onCommit,
  onPersist,
}: {
  editable: boolean;
  blockRef: React.MutableRefObject<Block>;
  gridRef: React.RefObject<HTMLDivElement | null>;
  ghostGridRef: React.RefObject<HTMLDivElement | null>;
  onCommit: (next: Block) => void;
  onPersist: () => void;
}) {
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const dragPreviewRef = useRef<DragPreview | null>(null);

  const dragModeRef = useRef<DragMode | null>(null);
  const dragOrigin = useRef<DragOrigin | null>(null);
  const bentoStartRows = useRef(0);
  const captureTarget = useRef<HTMLElement | null>(null);
  const capturePointerId = useRef<number | null>(null);
  const onCommitRef = useRef(onCommit);
  const onPersistRef = useRef(onPersist);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    onPersistRef.current = onPersist;
  }, [onPersist]);

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
  const handlePointerUpRef = useRef<() => void>(() => {});

  const applyDragPreview = useCallback((preview: DragPreview | null) => {
    dragPreviewRef.current = preview;
    setDragPreview(preview);
  }, []);

  const stablePointerMove = useCallback((e: PointerEvent) => {
    handlePointerMoveRef.current(e);
  }, []);

  const stablePointerUp = useCallback(() => {
    handlePointerUpRef.current();
  }, []);

  useEffect(() => {
    handlePointerMoveRef.current = (e: PointerEvent) => {
      const mode = dragModeRef.current;
      const origin = dragOrigin.current;
      if (!mode || !origin) return;

      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;

      if (mode.kind === "bento-height") {
        const deltaRows = deltaGridUnits(dy, origin.step);
        const minRows = Math.max(
          MIN_BENTO_ROWS,
          requiredBentoRows(blockRef.current),
        );
        const nextRows = Math.max(minRows, bentoStartRows.current + deltaRows);
        const prev = dragPreviewRef.current;
        if (prev?.bentoRows === nextRows) return;
        applyDragPreview({ bentoRows: nextRows });
        return;
      }

      const currentBlock = blockRef.current;
      const rowCount = getBentoRows(currentBlock);

      const preview = computePlacementFromDrag(
        mode,
        origin,
        dx,
        dy,
        rowCount,
      );
      if (!preview?.placement || !preview.childId) return;

      const resolved = previewChildPlacement(
        currentBlock,
        preview.childId,
        preview.placement,
        { expandRows: false },
      );

      const prev = dragPreviewRef.current;

      if (resolved.blocked) {
        if (prev?.childId === preview.childId && prev.placement) {
          return;
        }
        if (
          prev?.childId === preview.childId &&
          prev.blocked &&
          !prev.placement
        ) {
          return;
        }
        applyDragPreview({ childId: preview.childId, blocked: true });
        return;
      }

      if (
        prev?.childId === preview.childId &&
        !prev.blocked &&
        prev.placement?.col === resolved.placement.col &&
        prev.placement?.row === resolved.placement.row &&
        prev.placement?.colSpan === resolved.placement.colSpan &&
        prev.placement?.rowSpan === resolved.placement.rowSpan &&
        prev.bentoRows === resolved.bentoRows
      ) {
        return;
      }

      applyDragPreview({
        childId: preview.childId,
        placement: resolved.placement,
        bentoRows: resolved.bentoRows,
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
            { expandRows: false },
          );
        }

        if (nextBlock !== currentBlock) {
          onCommitRef.current(nextBlock);
          onPersistRef.current();
        }
      }

      applyDragPreview(null);
      endDrag();
      window.removeEventListener("pointermove", stablePointerMove);
      window.removeEventListener("pointerup", stablePointerUp);
      window.removeEventListener("pointercancel", stablePointerUp);
    };
  }, [
    applyDragPreview,
    blockRef,
    endDrag,
    stablePointerMove,
    stablePointerUp,
  ]);

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

      const measureEl = ghostGridRef.current ?? gridRef.current;
      const { step } = measureBentoGridStepFromDOM(measureEl);
      dragOrigin.current = {
        x: e.clientX,
        y: e.clientY,
        placement,
        step,
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
    [
      editable,
      gridRef,
      ghostGridRef,
      blockRef,
      stablePointerMove,
      stablePointerUp,
    ],
  );

  return { dragPreview, startDrag };
}
