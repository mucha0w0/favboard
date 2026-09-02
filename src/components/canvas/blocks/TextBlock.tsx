"use client";

import { type Block } from "@/lib/types";
import { useEffect, useRef } from "react";

interface TextBlockProps {
  block: Block;
  showPlaceholders?: boolean;
  editable?: boolean;
  onUpdate?: (body: string) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

function resizeTextarea(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export function TextBlock({
  block,
  showPlaceholders = false,
  editable = false,
  onUpdate,
  onBlur,
  autoFocus = false,
}: TextBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (editable && textareaRef.current) {
      resizeTextarea(textareaRef.current);
    }
  }, [editable, block.data.body]);

  if (editable) {
    return (
      <textarea
        ref={textareaRef}
        value={block.data.body ?? ""}
        onChange={(e) => {
          onUpdate?.(e.target.value);
          resizeTextarea(e.target);
        }}
        onBlur={onBlur}
        placeholder="本文を入力…"
        rows={1}
        className="m-0 w-full resize-none overflow-hidden border-none bg-transparent p-0 text-[15px] leading-[1.9] text-stone-700 placeholder:text-stone-300 outline-none"
      />
    );
  }

  const body = block.data.body?.trim();
  const isEmpty = !body;

  return (
    <div className="text-[15px] leading-[1.9] text-stone-700">
      {isEmpty ? (
        <p className="text-stone-300">
          {showPlaceholders ? "本文を入力…" : ""}
        </p>
      ) : (
        <p className="m-0 whitespace-pre-wrap">{body}</p>
      )}
    </div>
  );
}
