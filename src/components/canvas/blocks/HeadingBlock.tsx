import { type Block } from "@/lib/types";

interface HeadingBlockProps {
  block: Block;
}

export function HeadingBlock({ block }: HeadingBlockProps) {
  return (
    <h2 className="m-0 text-[1.375rem] font-bold leading-snug tracking-tight text-stone-900 sm:text-[1.5rem]">
      {block.data.text || "見出し"}
    </h2>
  );
}
