import { type Block } from "@/lib/types";
import { DividerBlock } from "./blocks/DividerBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { ProductBlock } from "./blocks/ProductBlock";

interface BlockRendererProps {
  block: Block;
  editable?: boolean;
}

export function BlockRenderer({ block, editable }: BlockRendererProps) {
  switch (block.type) {
    case "product":
      return (
        <ProductBlock block={block} showPlaceholders={editable} />
      );
    case "heading":
      return <HeadingBlock block={block} />;
    case "divider":
      return <DividerBlock block={block} />;
    default:
      return null;
  }
}
