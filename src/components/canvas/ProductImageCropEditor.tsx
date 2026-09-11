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

function ResizeBar({ orientation }: { orientation: "horizontal" | "vertical" }) {
  return (
    <span
      className={
        orientation === "horizontal"
          ? "h-0.5 w-6 rounded-full bg-stone-500/80"
          : "h-6 w-0.5 rounded-full bg-stone-500/80"
      }
    />
  );
}

/** トリミング外に半透明の白を重ねる */
function CropDimOverlay({ crop }: { crop: Rect }) {
  return (
    <>
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 bg-white/60"
        style={{ height: crop.y }}
      />
      <div
        className="pointer-events-none absolute left-0 right-0 bg-white/60"
        style={{
          top: crop.y + crop.height,
          bottom: 0,
        }}
      />
      <div
        className="pointer-events-none absolute left-0 bg-white/60"
        style={{
          top: crop.y,
          width: crop.x,
          height: crop.height,
        }}
      />
      <div
        className="pointer-events-none absolute right-0 bg-white/60"
        style={{
          top: crop.y,
          left: crop.x + crop.width,
          height: crop.height,
        }}
      />
    </>
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
      "absolute left-0 top-1/2 z-20 flex h-8 w-3 -translate-x-1/2 -translate-y-1/2 cursor-w-resize touch-none items-center justify-center",
    children: <ResizeBar orientation="vertical" />,
  },
  {
    edge: "n",
    className:
      "absolute left-1/2 top-0 z-20 flex h-3 w-8 -translate-x-1/2 -translate-y-1/2 cursor-n-resize touch-none items-center justify-center",
    children: <ResizeBar orientation="horizontal" />,
  },
  {
    edge: "e",
    className:
      "absolute right-0 top-1/2 z-20 flex h-8 w-3 translate-x-1/2 -translate-y-1/2 cursor-e-resize touch-none items-center justify-center",
    children: <ResizeBar orientation="vertical" />,
  },
  {
    edge: "s",
    className:
      "absolute bottom-0 left-1/2 z-20 flex h-3 w-8 -translate-x-1/2 translate-y-1/2 cursor-s-resize touch-none items-center justify-center",
    children: <ResizeBar orientation="horizontal" />,
  },
  {
    edge: "nw",
    className:
      "absolute left-0 top-0 z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize touch-none",
  },
  {
    edge: "ne",
    className:
      "absolute right-0 top-0 z-20 h-3 w-3 translate-x-1/2 -translate-y-1/2 cursor-ne-resize touch-none",
  },
  {
    edge: "sw",
    className:
      "absolute bottom-0 left-0 z-20 h-3 w-3 -translate-x-1/2 translate-y-1/2 cursor-sw-resize touch-none",
  },
  {
    edge: "se",
    className:
      "absolute bottom-0 right-0 z-20 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-se-resize touch-none",
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
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={normalizePreviewUrl(imageUrl)}
          alt="商品画像プレビュー"
          fill
          className="object-contain"
          unoptimized
          draggable={false}
          onError={() => onError?.()}
        />
      </div>

      {isAspectSynced && screenRect && imageBounds && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: imageBounds.x,
            top: imageBounds.y,
            width: imageBounds.width,
            height: imageBounds.height,
          }}
        >
          <CropDimOverlay
            crop={{
              x: screenRect.x - imageBounds.x,
              y: screenRect.y - imageBounds.y,
              width: screenRect.width,
              height: screenRect.height,
            }}
          />
          <div
            className="pointer-events-auto absolute touch-none ring-1 ring-stone-400"
            style={{
              left: screenRect.x - imageBounds.x,
              top: screenRect.y - imageBounds.y,
              width: screenRect.width,
              height: screenRect.height,
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
