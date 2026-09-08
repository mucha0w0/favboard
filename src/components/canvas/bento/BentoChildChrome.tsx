"use client";

import type { ResizeEdge } from "@/lib/bento";
import { GripHorizontal, Pencil, Trash2 } from "lucide-react";

interface BentoChildChromeProps {
  onStartMove: (e: React.PointerEvent) => void;
  onStartResize: (e: React.PointerEvent, edge: ResizeEdge) => void;
  onDelete: () => void;
  showEdit?: boolean;
  onEdit?: () => void;
}

const EDGE_HANDLES: {
  edge: ResizeEdge;
  className: string;
  children?: React.ReactNode;
}[] = [
  {
    edge: "left",
    className: "absolute inset-y-2 left-0 z-20 w-2 cursor-w-resize touch-none",
  },
  {
    edge: "top",
    className:
      "absolute inset-x-2 top-0 z-20 flex h-3 cursor-n-resize touch-none items-start justify-center",
    children: (
      <span className="mt-0.5 h-1 w-8 rounded-full bg-stone-300/80" />
    ),
  },
  {
    edge: "right",
    className: "absolute inset-y-2 right-0 z-20 w-2 cursor-e-resize touch-none",
  },
  {
    edge: "bottom",
    className:
      "absolute inset-x-2 bottom-0 z-20 flex h-3 cursor-s-resize touch-none items-end justify-center",
    children: (
      <span className="mb-0.5 h-1 w-8 rounded-full bg-stone-300/80" />
    ),
  },
  {
    edge: "nw",
    className: "absolute left-0 top-0 z-20 h-4 w-4 cursor-nw-resize touch-none",
  },
  {
    edge: "ne",
    className: "absolute right-0 top-0 z-20 h-4 w-4 cursor-ne-resize touch-none",
  },
  {
    edge: "sw",
    className:
      "absolute bottom-0 left-0 z-20 h-4 w-4 cursor-sw-resize touch-none",
  },
  {
    edge: "se",
    className:
      "absolute bottom-0 right-0 z-20 h-4 w-4 cursor-se-resize touch-none",
  },
];

export function BentoChildChrome({
  onStartMove,
  onStartResize,
  onDelete,
  showEdit,
  onEdit,
}: BentoChildChromeProps) {
  return (
    <>
      <button
        type="button"
        className="absolute left-1 top-1 z-30 flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded bg-white/90 text-stone-400 shadow-sm active:cursor-grabbing"
        aria-label="移動"
        onPointerDown={onStartMove}
      >
        <GripHorizontal className="h-3.5 w-3.5 rotate-90" />
      </button>
      <button
        type="button"
        className="absolute right-1 top-1 z-30 flex h-6 w-6 items-center justify-center rounded bg-white/90 text-red-500 shadow-sm"
        aria-label="削除"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </button>
      {EDGE_HANDLES.map(({ edge, className, children }) => (
        <div
          key={edge}
          className={className}
          onPointerDown={(e) => onStartResize(e, edge)}
        >
          {children}
        </div>
      ))}
      {showEdit && onEdit && (
        <button
          type="button"
          className="absolute bottom-1 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-medium text-stone-600 shadow-sm ring-1 ring-stone-200/80 transition-colors hover:bg-white hover:text-stone-900"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-3 w-3" />
          編集
        </button>
      )}
    </>
  );
}
