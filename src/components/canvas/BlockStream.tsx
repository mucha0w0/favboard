"use client";

import { createTopLevelBlock } from "@/lib/bento";
import { type Block, type TopLevelBlockType } from "@/lib/types";
import dynamic from "next/dynamic";
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

/** @deprecated Use createTopLevelBlock from `@/lib/bento` */
export function createBlock(type: TopLevelBlockType): Block {
  return createTopLevelBlock(type);
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
  return (
    <div className="document-body w-full">
      {blocks.length === 0 && editable && (
        <p className="py-12 text-[15px] leading-relaxed text-stone-400">
          下の ＋ から、Bento・見出し・区切り線を追加できます
        </p>
      )}

      <div className="flex flex-col">
        {blocks.map((block, index) => (
          <StaticBlockShell
            key={block.id}
            block={block}
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
