import { type Block, type BlockData } from "@/lib/types";
import { BentoBlock } from "./blocks/BentoBlock";
import { DividerBlock } from "./blocks/DividerBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { ProductBlock } from "./blocks/ProductBlock";
import { TextBlock } from "./blocks/TextBlock";

interface BlockRendererProps {
  block: Block;
  editable?: boolean;
  productLayout?: "inline" | "grid";
  cellSpan?: { colSpan: number; rowSpan: number };
  focusBlockId?: string | null;
  onUpdateBlockData?: (blockId: string, data: Partial<BlockData>) => void;
  onBlockBlur?: (blockId: string) => void;
  onUpdateBento?: (bentoId: string, data: Partial<BlockData>) => void;
  onEditBentoChild?: (
    bentoId: string,
    child: Block,
    opts?: { isNew?: boolean },
  ) => void;
  onBentoChildBlur?: (bentoId: string, childId: string) => void;
  onPersistBento?: (bentoId: string) => void;
  autoFocus?: boolean;
}

export function BlockRenderer({
  block,
  editable,
  productLayout = "inline",
  cellSpan,
  focusBlockId,
  onUpdateBlockData,
  onBlockBlur,
  onUpdateBento,
  onEditBentoChild,
  onBentoChildBlur,
  onPersistBento,
  autoFocus,
}: BlockRendererProps) {
  switch (block.type) {
    case "bento":
      return (
        <BentoBlock
          block={block}
          editable={editable}
          focusBlockId={focusBlockId}
          onUpdateBento={onUpdateBento}
          onEditChild={onEditBentoChild}
          onChildBlur={onBentoChildBlur}
          onPersistBento={onPersistBento}
        />
      );
    case "product":
      return (
        <ProductBlock
          block={block}
          showPlaceholders={editable}
          layout={productLayout}
          cellSpan={cellSpan}
          showOfficialLink={!editable}
        />
      );
    case "heading":
      return (
        <HeadingBlock
          block={block}
          editable={editable}
          autoFocus={autoFocus}
          onUpdate={(text) => onUpdateBlockData?.(block.id, { text })}
          onBlur={() => onBlockBlur?.(block.id)}
        />
      );
    case "text":
      return (
        <TextBlock
          block={block}
          showPlaceholders={editable}
          editable={editable}
          autoFocus={autoFocus}
          onUpdate={(body) => onUpdateBlockData?.(block.id, { body })}
          onBlur={() => onBlockBlur?.(block.id)}
        />
      );
    case "divider":
      return <DividerBlock />;
    default:
      return null;
  }
}
