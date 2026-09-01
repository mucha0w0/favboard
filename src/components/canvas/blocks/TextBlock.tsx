import { type Block } from "@/lib/types";

interface TextBlockProps {
  block: Block;
  showPlaceholders?: boolean;
}

export function TextBlock({ block, showPlaceholders = false }: TextBlockProps) {
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
