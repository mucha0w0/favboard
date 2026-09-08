"use client";

import { Button } from "@/components/ui/button";
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
      "absolute inset-y-2 left-1.5 z-20 flex w-3 cursor-w-resize touch-none items-center justify-start",
    children: <ResizeBar orientation="vertical" />,
  },
  {
    edge: "top",
    className:
      "absolute inset-x-2 top-1.5 z-20 flex h-3 cursor-n-resize touch-none items-start justify-center",
    children: <ResizeBar orientation="horizontal" />,
  },
  {
    edge: "right",
    className:
      "absolute inset-y-2 right-1.5 z-20 flex w-3 cursor-e-resize touch-none items-center justify-end",
    children: <ResizeBar orientation="vertical" />,
  },
  {
    edge: "bottom",
    className:
      "absolute inset-x-2 bottom-1.5 z-20 flex h-3 cursor-s-resize touch-none items-end justify-center",
    children: <ResizeBar orientation="horizontal" />,
  },
  {
    edge: "nw",
    className: "absolute left-1 top-1 z-20 h-4 w-4 cursor-nw-resize touch-none",
  },
  {
    edge: "ne",
    className: "absolute right-1 top-1 z-20 h-4 w-4 cursor-ne-resize touch-none",
  },
  {
    edge: "sw",
    className:
      "absolute bottom-1 left-1 z-20 h-4 w-4 cursor-sw-resize touch-none",
  },
  {
    edge: "se",
    className:
      "absolute bottom-1 right-1 z-20 h-4 w-4 cursor-se-resize touch-none",
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
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute left-1 top-1 z-30 h-7 w-7 cursor-grab touch-none bg-white/90 text-stone-400 shadow-sm hover:text-stone-600 active:cursor-grabbing"
        aria-label="移動"
        onPointerDown={onStartMove}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute right-1 top-1 z-30 h-7 w-7 bg-white/90 text-stone-400 shadow-sm hover:text-red-600"
        aria-label="削除"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute bottom-1 left-1/2 z-30 h-7 -translate-x-1/2 bg-white/95 px-2.5 text-[11px] shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-3 w-3" />
          編集
        </Button>
      )}
    </>
  );
}
