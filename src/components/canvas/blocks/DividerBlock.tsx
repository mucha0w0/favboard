import { type Block } from "@/lib/types";

interface DividerBlockProps {
  block: Block;
}

export function DividerBlock({ block: _block }: DividerBlockProps) {
  return <hr className="m-0 border-0 border-t border-stone-200" />;
}
