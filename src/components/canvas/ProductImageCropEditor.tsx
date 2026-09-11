"use client";

import {
  adaptCropToAspect,
  cropMatchesAspect,
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

/** BentoChildChrome と同じリサイズバー */
function ResizeBar({ orientation }: { orientation: "horizontal" | "vertical" }) {
  return (
    <span
      className={
        orientation === "horizontal"
          ? "h-0.5 w-8 rounded-full bg-stone-400/70"
          : "h-8 w-0.5 rounded-full bg-stone-400/70"
      }
    />
  );
}

const EDGE_HANDLES: {
  edge: CropResizeHandle;
  className: string;
  children?: React.ReactNode;
}[] = [
  {
    edge: "w",
    className:
      "absolute inset-y-2 left-0 z-20 flex w-3 -translate-x-full cursor-w-resize touch-none items-center justify-center",
    children: <ResizeBar orientation="vertical" />,
  },
  {
    edge: "n",
    className:
      "absolute inset-x-2 top-0 z-20 flex h-3 -translate-y-full cursor-n-resize touch-none items-start justify-center",
    children: <ResizeBar orientation="horizontal" />,
  },
  {
    edge: "e",
    className:
      "absolute inset-y-2 right-0 z-20 flex w-3 translate-x-full cursor-e-resize touch-none items-center justify-end",
    children: <ResizeBar orientation="vertical" />,
  },
  {
    edge: "s",
    className:
      "absolute inset-x-2 bottom-0 z-20 flex h-3 translate-y-full cursor-s-resize touch-none items-end justify-center",
    children: <ResizeBar orientation="horizontal" />,
  },
  {
    edge: "nw",
    className:
      "absolute left-0 top-0 z-20 h-4 w-4 -translate-x-full -translate-y-full cursor-nw-resize touch-none",
  },
  {
    edge: "ne",
    className:
      "absolute right-0 top-0 z-20 h-4 w-4 translate-x-full -translate-y-full cursor-ne-resize touch-none",
  },
  {
    edge: "sw",
    className:
      "absolute bottom-0 left-0 z-20 h-4 w-4 -translate-x-full translate-y-full cursor-sw-resize touch-none",
  },
  {
    edge: "se",
    className:
      "absolute bottom-0 right-0 z-20 h-4 w-4 translate-x-full translate-y-full cursor-se-resize touch-none",
  },
];

export function ProductImageCropEditor({
  imageUrl,
  crop,
  cropAspect,
  onCropChange,
  onError,
}: ProductImageCropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const lastAppliedAspectRef = useRef<number | null>(null);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isAspectSynced, setIsAspectSynced] = useState(false);

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
    lastAppliedAspectRef.current = null;
    setIsAspectSynced(false);
  }, [imageUrl, cropAspect]);

  useEffect(() => {
    if (!naturalSize || !imageBounds) return;
    if (lastAppliedAspectRef.current === cropAspect) {
      setIsAspectSynced(true);
      return;
    }

    const { width: imageWidth, height: imageHeight } = naturalSize;

    if (
      crop &&
      cropMatchesAspect(crop, imageWidth, imageHeight, cropAspect)
    ) {
      lastAppliedAspectRef.current = cropAspect;
      setIsAspectSynced(true);
      return;
    }

    const next = crop
      ? adaptCropToAspect(crop, imageWidth, imageHeight, cropAspect)
      : defaultImageCrop(imageWidth, imageHeight, cropAspect);

    lastAppliedAspectRef.current = cropAspect;
    onCropChange(next);
    setIsAspectSynced(true);
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

      {isAspectSynced && screenRect && (
        <div className="absolute inset-0 touch-none">
          <div
            className="absolute ring-1 ring-stone-400"
            style={{
              left: screenRect.x,
              top: screenRect.y,
              width: screenRect.width,
              height: screenRect.height,
              boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)",
              cursor: "move",
            }}
            onPointerDown={handlePointerDown("move")}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {EDGE_HANDLES.map(({ edge, className, children }) => (
              <div
                key={edge}
                className={className}
                onPointerDown={handlePointerDown(edge)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {children}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
