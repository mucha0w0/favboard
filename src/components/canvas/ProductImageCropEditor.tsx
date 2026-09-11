"use client";

import {
  cropToScreenRect,
  defaultImageCrop,
  getContainedImageBounds,
  resizeScreenRect,
  screenRectToCrop,
  type CropResizeHandle,
  type Rect,
} from "@/lib/image-crop";
import type { ImageCrop } from "@/lib/types";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type DragState = {
  mode: CropResizeHandle;
  startPointer: { x: number; y: number };
  startRect: Rect;
};

interface ProductImageCropEditorProps {
  imageUrl: string;
  crop: ImageCrop | undefined;
  cropAspect: number;
  onCropChange: (crop: ImageCrop) => void;
  onError?: () => void;
}

function normalizePreviewUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

const HANDLE_CURSORS: Record<CropResizeHandle, string> = {
  move: "move",
  nw: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  se: "nwse-resize",
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
};

export function ProductImageCropEditor({
  imageUrl,
  crop,
  cropAspect,
  onCropChange,
  onError,
}: ProductImageCropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const initializedRef = useRef(false);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setNaturalSize({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      setNaturalSize(null);
      onError?.();
    };
    img.src = normalizePreviewUrl(imageUrl);
  }, [imageUrl, onError]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const imageBounds =
    naturalSize && containerSize.width > 0
      ? getContainedImageBounds(
          containerSize.width,
          containerSize.height,
          naturalSize.width,
          naturalSize.height,
        )
      : null;

  useEffect(() => {
    initializedRef.current = false;
  }, [imageUrl, cropAspect]);

  useEffect(() => {
    if (!naturalSize || !imageBounds || crop || initializedRef.current) return;
    initializedRef.current = true;
    onCropChange(
      defaultImageCrop(naturalSize.width, naturalSize.height, cropAspect),
    );
  }, [naturalSize, imageBounds, crop, cropAspect, onCropChange]);

  const screenRect =
    crop && imageBounds ? cropToScreenRect(crop, imageBounds) : null;
  const minCropWidth = Math.max(24, imageBounds ? imageBounds.width * 0.08 : 24);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    document.body.style.userSelect = "";
    document.body.style.touchAction = "";
  }, []);

  const handlePointerDown = useCallback(
    (mode: CropResizeHandle) => (e: React.PointerEvent) => {
      if (!screenRect || !imageBounds) return;
      e.preventDefault();
      e.stopPropagation(); // 移動ハンドラへの伝播を防ぐ

      dragRef.current = {
        mode,
        startPointer: { x: e.clientX, y: e.clientY },
        startRect: screenRect,
      };
      document.body.style.userSelect = "none";
      document.body.style.touchAction = "none";
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [imageBounds, screenRect],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !imageBounds) return;

      const dx = e.clientX - drag.startPointer.x;
      const dy = e.clientY - drag.startPointer.y;
      const nextRect = resizeScreenRect(
        drag.mode,
        drag.startRect,
        dx,
        dy,
        imageBounds,
        cropAspect,
        minCropWidth,
      );
      onCropChange(screenRectToCrop(nextRect, imageBounds));
    },
    [cropAspect, imageBounds, minCropWidth, onCropChange],
  );

  const handlePointerUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Image
        src={normalizePreviewUrl(imageUrl)}
        alt="商品画像プレビュー"
        fill
        className="object-contain"
        unoptimized
        draggable={false}
        onError={() => onError?.()}
      />

      {screenRect && (
        <div className="absolute inset-0 touch-none">
          <div
            className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
            style={{
              left: screenRect.x,
              top: screenRect.y,
              width: screenRect.width,
              height: screenRect.height,
              boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)",
              cursor: HANDLE_CURSORS.move,
            }}
            onPointerDown={handlePointerDown("move")}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {(["nw", "ne", "sw", "se", "n", "s", "e", "w"] as CropResizeHandle[]).map(
              (handle) => {
                const positionClass =
                  handle === "nw"
                    ? "left-0 top-0 -translate-x-1/2 -translate-y-1/2"
                    : handle === "ne"
                      ? "right-0 top-0 translate-x-1/2 -translate-y-1/2"
                      : handle === "sw"
                        ? "bottom-0 left-0 -translate-x-1/2 translate-y-1/2"
                        : handle === "se"
                          ? "bottom-0 right-0 translate-x-1/2 translate-y-1/2"
                          : handle === "n"
                            ? "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
                            : handle === "s"
                              ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
                              : handle === "e"
                                ? "right-0 top-1/2 translate-x-1/2 -translate-y-1/2"
                                : "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2";

                return (
                  <div
                    key={handle}
                    className={`absolute h-3 w-3 rounded-full border border-white bg-stone-700 shadow ${positionClass}`}
                    style={{ cursor: HANDLE_CURSORS[handle] }}
                    onPointerDown={handlePointerDown(handle)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  />
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
}
