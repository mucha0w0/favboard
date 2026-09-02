"use client";

import { type Block } from "@/lib/types";
import { useEffect, useRef } from "react";

interface HeadingBlockProps {
  block: Block;
  editable?: boolean;
  onUpdate?: (text: string) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export function HeadingBlock({
  block,
  editable = false,
  onUpdate,
  onBlur,
  autoFocus = false,
}: HeadingBlockProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  if (editable) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={block.data.text ?? ""}
        onChange={(e) => onUpdate?.(e.target.value)}
        onBlur={onBlur}
        placeholder="見出し"
        className="m-0 w-full border-none bg-transparent p-0 text-[1.375rem] font-bold leading-snug tracking-tight text-stone-900 placeholder:text-stone-300 outline-none sm:text-[1.5rem]"
      />
    );
  }

  return (
    <h2 className="m-0 text-[1.375rem] font-bold leading-snug tracking-tight text-stone-900 sm:text-[1.5rem]">
      {block.data.text || "見出し"}
    </h2>
  );
}
