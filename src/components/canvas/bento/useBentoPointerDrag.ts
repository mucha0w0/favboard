"use client";

import {
  type DragMode,
  type DragOrigin,
  computeFloatRect,
  getBentoRows,
  measureBentoGridGeometry,
  MIN_BENTO_ROWS,
  placementToPixels,
  previewChildPlacement,
  requiredBentoRows,
  rowsFromPointerDelta,
  setBentoRows,
  snapFloatToPlacement,
  updateChildPlacement,
} from "@/lib/bento";
import type { BentoCellPlacement, Block } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

export type BentoDragVisual = {
  kind: "child" | "bento-height";
  childId?: string;
  /** スナップ先（グリッド上のゴースト） */
  snap?: BentoCellPlacement;
  bentoRows?: number;
  blocked: boolean;
};

export function useBentoPointerDrag({
  editable,
  blockRef,
  gridRef,
  onCommit,
  onPersist,
}: {
  editable: boolean;
  blockRef: React.MutableRefObject<Block>;
  gridRef: React.RefObject<HTMLDivElement | null>;
  onCommit: (next: Block) => void;
  onPersist: () => void;
}) {
  const [dragVisual, setDragVisual] = useState<BentoDragVisual | null>(null);
  const dragVisualRef = useRef<BentoDragVisual | null>(null);

  const dragModeRef = useRef<DragMode | null>(null);
  const dragOriginRef = useRef<DragOrigin | null>(null);
  const captureTarget = useRef<HTMLElement | null>(null);
  const capturePointerId = useRef<number | null>(null);
  const rafRef = useRef(0);
  const latestPointerRef = useRef<{ x: number; y: number } | null>(null);

  const onCommitRef = useRef(onCommit);
  const onPersistRef = useRef(onPersist);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    onPersistRef.current = onPersist;
  }, [onPersist]);

  const applyVisual = useCallback((visual: BentoDragVisual | null) => {
    dragVisualRef.current = visual;
    setDragVisual(visual);
  }, []);

  const endDrag = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    latestPointerRef.current = null;

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
    dragOriginRef.current = null;
  }, []);

  const handlePointerMoveRef = useRef<(e: PointerEvent) => void>(() => {});
  const handlePointerUpRef = useRef<() => void>(() => {});

  const stablePointerMove = useCallback((e: PointerEvent) => {
    handlePointerMoveRef.current(e);
  }, []);

  const stablePointerUp = useCallback(() => {
    handlePointerUpRef.current();
  }, []);

  const processPointer = useCallback(
    (clientX: number, clientY: number) => {
      const mode = dragModeRef.current;
      const origin = dragOriginRef.current;
      if (!mode || !origin) return;

      if (mode.kind === "bento-height") {
        const minRows = Math.max(
          MIN_BENTO_ROWS,
          requiredBentoRows(blockRef.current),
        );
        const dy = clientY - origin.pointerY;
        const nextRows = rowsFromPointerDelta(
          dy,
          origin.geo.step,
          origin.startRows,
          minRows,
        );
        const prev = dragVisualRef.current;
        if (
          prev?.kind === "bento-height" &&
          prev.bentoRows === nextRows &&
          !prev.blocked
        ) {
          return;
        }
        applyVisual({
          kind: "bento-height",
          bentoRows: nextRows,
          blocked: false,
        });
        return;
      }

      const float = computeFloatRect(mode, origin, clientX, clientY);
      const currentRows = getBentoRows(blockRef.current);
      const { placement: snapped } = snapFloatToPlacement(
        float,
        origin.geo,
        Math.max(currentRows, origin.startRows),
        { expandRows: true },
      );

      const resolved = previewChildPlacement(
        blockRef.current,
        mode.childId,
        snapped,
        { expandRows: true },
      );

      const next: BentoDragVisual = {
        kind: "child",
        childId: mode.childId,
        snap: resolved.placement,
        bentoRows: resolved.bentoRows,
        blocked: resolved.blocked,
      };

      const prev = dragVisualRef.current;
      if (
        prev?.kind === "child" &&
        prev.childId === next.childId &&
        prev.blocked === next.blocked &&
        prev.bentoRows === next.bentoRows &&
        prev.snap?.col === next.snap?.col &&
        prev.snap?.row === next.snap?.row &&
        prev.snap?.colSpan === next.snap?.colSpan &&
        prev.snap?.rowSpan === next.snap?.rowSpan
      ) {
        return;
      }

      applyVisual(next);
    },
    [applyVisual, blockRef],
  );

  useEffect(() => {
    handlePointerMoveRef.current = (e: PointerEvent) => {
      latestPointerRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const p = latestPointerRef.current;
        if (!p) return;
        processPointer(p.x, p.y);
      });
    };

    handlePointerUpRef.current = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      // 最終位置を確定してからコミット
      const pending = latestPointerRef.current;
      if (pending) {
        processPointer(pending.x, pending.y);
      }

      const mode = dragModeRef.current;
      const visual = dragVisualRef.current;

      if (mode && visual) {
        const currentBlock = blockRef.current;
        let nextBlock = currentBlock;

        if (mode.kind === "bento-height" && visual.bentoRows != null) {
          nextBlock = setBentoRows(currentBlock, visual.bentoRows);
        } else if (
          visual.kind === "child" &&
          visual.childId &&
          visual.snap &&
          !visual.blocked &&
          (mode.kind === "move" || mode.kind === "resize")
        ) {
          nextBlock = updateChildPlacement(
            currentBlock,
            visual.childId,
            visual.snap,
            { expandRows: true },
          );
        }

        if (nextBlock !== currentBlock) {
          onCommitRef.current(nextBlock);
          onPersistRef.current();
        }
      }

      applyVisual(null);
      endDrag();
      window.removeEventListener("pointermove", stablePointerMove);
      window.removeEventListener("pointerup", stablePointerUp);
      window.removeEventListener("pointercancel", stablePointerUp);
    };
  }, [
    applyVisual,
    blockRef,
    endDrag,
    processPointer,
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

      const geo = measureBentoGridGeometry(gridRef.current);
      const startRows = getBentoRows(blockRef.current);
      const startRect = placementToPixels(placement, geo);

      dragOriginRef.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        startRect,
        startPlacement: placement,
        geo,
        startRows,
      };
      dragModeRef.current = mode;

      if (mode.kind === "bento-height") {
        applyVisual({
          kind: "bento-height",
          bentoRows: startRows,
          blocked: false,
        });
      } else {
        applyVisual({
          kind: "child",
          childId: mode.childId,
          snap: placement,
          bentoRows: startRows,
          blocked: false,
        });
      }

      // 子ハンドルはドラッグ開始直後にアンマウントされうるので、
      // グリッド（または高さグリップ自身）に capture する
      const target =
        mode.kind === "bento-height"
          ? (e.currentTarget as HTMLElement)
          : (gridRef.current as HTMLElement);
      captureTarget.current = target;
      capturePointerId.current = e.pointerId;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      document.body.style.userSelect = "none";
      document.body.style.touchAction = "none";

      window.addEventListener("pointermove", stablePointerMove);
      window.addEventListener("pointerup", stablePointerUp);
      window.addEventListener("pointercancel", stablePointerUp);
    },
    [
      editable,
      gridRef,
      blockRef,
      applyVisual,
      stablePointerMove,
      stablePointerUp,
    ],
  );

  return { dragVisual, startDrag };
}
