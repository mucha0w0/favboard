import { type Block, type BlockData } from "@/lib/types";
import { DividerBlock } from "./blocks/DividerBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { ProductBlock } from "./blocks/ProductBlock";
import { TextBlock } from "./blocks/TextBlock";

interface BlockRendererProps {
  block: Block;
  editable?: boolean;
  productLayout?: "inline" | "grid";
  gridSize?: "compact" | "standard";
  onUpdateBlockData?: (blockId: string, data: Partial<BlockData>) => void;
  onBlockBlur?: (blockId: string) => void;
  autoFocus?: boolean;
}

export function BlockRenderer({
  block,
  editable,
  productLayout = "inline",
  gridSize,
  onUpdateBlockData,
  onBlockBlur,
  autoFocus,
}: BlockRendererProps) {
  switch (block.type) {
    case "product":
      return (
        <ProductBlock
          block={block}
          showPlaceholders={editable}
          layout={productLayout}
          gridSize={gridSize}
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
