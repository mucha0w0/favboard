"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  className,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-stone-900/15 backdrop-blur-[3px]"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col bg-stone-50 shadow-2xl shadow-stone-900/10",
          className,
        )}
        role="dialog"
        aria-modal
        aria-labelledby="dialog-title"
      >
        <div className="flex shrink-0 items-center justify-between px-5 py-4">
          <h2 id="dialog-title" className="text-base font-medium text-stone-900">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="閉じる"
            className="h-8 w-8 text-stone-400"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
