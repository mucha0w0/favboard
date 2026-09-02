"use client";

import { getBlockDisplayLayout } from "@/lib/block-layout";
import { createBentoBlock } from "@/lib/bento-layout";
import { type Block, type TopLevelBlockType } from "@/lib/types";
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
  onEditBlock?: (block: Block, context?: { bentoId: string }) => void;
  onUpdateBlockData?: (blockId: string, data: Partial<Block["data"]>) => void;
  onBlockBlur?: (blockId: string) => void;
  focusBlockId?: string | null;
  onDeleteBlock?: (blockId: string) => void;
  onReorder?: (blocks: Block[]) => void;
  onUpdateBento?: (bentoId: string, data: Partial<Block["data"]>) => void;
  onBentoChildBlur?: (bentoId: string, childId: string) => void;
  onPersistBento?: (bentoId: string) => void;
}

export function createBlock(type: TopLevelBlockType): Block {
  if (type === "bento") return createBentoBlock();
  return {
    id: crypto.randomUUID(),
    type,
    data: type === "heading" ? { text: "" } : {},
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
  onUpdateBento,
  onBentoChildBlur,
  onPersistBento,
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
          下の ＋ から、Bento・見出し・区切り線を追加できます
        </p>
      )}

      <div className="flex flex-col">
        {blockLayouts.map(({ block, index, layout }) => (
          <StaticBlockShell
            key={block.id}
            block={block}
            className={layout.colClass}
            onEditBlock={onEditBlock}
            onUpdateBlockData={onUpdateBlockData}
            onBlockBlur={onBlockBlur}
            focusBlockId={focusBlockId}
            onDeleteBlock={onDeleteBlock}
            onUpdateBento={onUpdateBento}
            onBentoChildBlur={onBentoChildBlur}
            onPersistBento={onPersistBento}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            canMoveUp={index > 0}
            canMoveDown={index < blocks.length - 1}
          />
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
