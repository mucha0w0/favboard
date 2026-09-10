"use client";

import type { ResizeEdge } from "@/lib/bento";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

interface BentoChildChromeProps {
  onStartMove: (e: React.PointerEvent) => void;
  onStartResize: (e: React.PointerEvent, edge: ResizeEdge) => void;
  onDelete: () => void;
  showEdit?: boolean;
  onEdit?: () => void;
}

/** リサイズ用の細いバー（移動の6ドットと視覚的に区別） */
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
  edge: ResizeEdge;
  className: string;
  children?: React.ReactNode;
}[] = [
  {
    edge: "left",
    className:
      "absolute inset-y-2 left-0 z-20 flex w-3 -translate-x-full cursor-w-resize touch-none items-center justify-center",
    children: <ResizeBar orientation="vertical" />,
  },
  {
    edge: "top",
    className:
      "absolute inset-x-2 top-0 z-20 flex h-3 -translate-y-full cursor-n-resize touch-none items-center justify-center",
    children: <ResizeBar orientation="horizontal" />,
  },
  {
    edge: "right",
    className:
      "absolute inset-y-2 right-0 z-20 flex w-3 translate-x-full cursor-e-resize touch-none items-center justify-center",
    children: <ResizeBar orientation="vertical" />,
  },
  {
    edge: "bottom",
    className:
      "absolute inset-x-2 bottom-0 z-20 flex h-3 translate-y-full cursor-s-resize touch-none items-center justify-center",
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
        className="absolute -left-0.5 top-0 z-30 -translate-x-full cursor-grab touch-none p-0.5 text-stone-400 hover:text-stone-600 active:cursor-grabbing"
        aria-label="移動"
        onPointerDown={onStartMove}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="absolute right-1.5 top-1.5 z-30 flex items-center gap-2.5">
        {showEdit && onEdit && (
          <button
            type="button"
            className="inline-flex items-center gap-1 border-b border-stone-300 pb-0.5 text-[11px] text-stone-400 hover:border-stone-500 hover:text-stone-600"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="h-3 w-3" />
            編集
          </button>
        )}
        <button
          type="button"
          className="p-0.5 text-stone-400 hover:text-red-600"
          aria-label="削除"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {EDGE_HANDLES.map(({ edge, className, children }) => (
        <div
          key={edge}
          className={className}
          onPointerDown={(e) => onStartResize(e, edge)}
        >
          {children}
        </div>
      ))}
    </>
  );
}
