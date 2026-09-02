import type { Block } from "@/lib/types";

/** トップレベルはすべて全幅（見出し・区切り線・Bento） */
export type BlockDisplayLayout = {
  colClass: "col-span-full";
};

export function getBlockDisplayLayout(
  _blocks: Block[],
  _index: number,
): BlockDisplayLayout {
  return { colClass: "col-span-full" };
}
