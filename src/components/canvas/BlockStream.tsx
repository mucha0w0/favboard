"use client";

import { getBlockDisplayLayout } from "@/lib/block-layout";
import { type Block, type BlockType } from "@/lib/types";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { StaticBlockShell } from "./BlockStreamParts";

const BlockStreamEditor = dynamic(
  () =>
    import("./BlockStreamEditor").then((module) => module.BlockStreamEditor),
  {
    ssr: false,
    loading: () => null,
  },
);

interface BlockStreamProps {
  blocks: Block[];
  editable?: boolean;
  onEditBlock?: (block: Block) => void;
  onUpdateBlockData?: (blockId: string, data: Partial<Block["data"]>) => void;
  onBlockBlur?: (blockId: string) => void;
  focusBlockId?: string | null;
  onDeleteBlock?: (blockId: string) => void;
  onReorder?: (blocks: Block[]) => void;
}

export function createBlock(type: BlockType): Block {
  return {
    id: crypto.randomUUID(),
    type,
    data:
      type === "heading"
        ? { text: "" }
        : type === "text"
          ? { body: "" }
          : type === "product"
            ? { product_size: "standard" }
            : {},
  };
}

function BlockStreamView({
  blocks,
  editable = false,
  onEditBlock,
  onUpdateBlockData,
  onBlockBlur,
  focusBlockId,
  onDeleteBlock,
}: BlockStreamProps) {
  const blockLayouts = useMemo(
    () =>
      blocks.map((block, index) => ({
        block,
        index,
        layout: getBlockDisplayLayout(blocks, index),
      })),
    [blocks],
  );

  return (
    <div className="document-body w-full">
      {blocks.length === 0 && editable && (
        <p className="py-12 text-[15px] leading-relaxed text-stone-400">
          下の ＋ から、商品・テキスト・見出しなどを追加できます
        </p>
      )}

      <div className="grid grid-cols-6 gap-x-3">
        {blockLayouts.map(({ block, index, layout }) => (
          <div key={block.id} className="contents">
            <div className={layout.colClass}>
              <StaticBlockShell
                block={block}
                inGrid={layout.inGrid}
                gridSize={layout.gridSize}
                onEditBlock={onEditBlock}
                onUpdateBlockData={onUpdateBlockData}
                onBlockBlur={onBlockBlur}
                autoFocus={focusBlockId === block.id}
                onDeleteBlock={onDeleteBlock}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                canMoveUp={index > 0}
                canMoveDown={index < blocks.length - 1}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BlockStream(props: BlockStreamProps) {
  if (!props.editable) {
    return <BlockStreamView {...props} editable={false} />;
  }

  return <BlockStreamEditor {...props} />;
}

/** @deprecated Use BlockStream */
export const CardStack = BlockStream;
