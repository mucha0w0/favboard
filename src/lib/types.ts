export type BlockType = "product" | "heading" | "divider" | "text";

export type ProductSize = "compact" | "standard" | "large" | "xl";

/** @deprecated Legacy bento layout — ignored in card stack mode */
export interface BlockLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BlockData {
  title?: string;
  brand?: string;
  price?: string;
  image_url?: string;
  product_url?: string;
  comment?: string;
  /** 見出し用 */
  text?: string;
  /** 本文用（長文） */
  body?: string;
  product_size?: ProductSize | "banner";
  /** @deprecated use pair_layout */
  product_pair_layout?: "row" | "stack";
  /** 次の同種グリッドブロック（S/M商品・テキスト）との並び方（2件ペア時） */
  pair_layout?: "row" | "stack";
}

export interface Block {
  id: string;
  type: BlockType;
  data: BlockData;
  /** @deprecated Legacy field — order is determined by array index */
  layout?: BlockLayout;
}

export interface Canvas {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  blocks: Block[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface OgpData {
  title?: string;
  image?: string;
  description?: string;
  siteName?: string;
}

export const PRODUCT_SIZES: {
  value: ProductSize;
  label: string;
  description: string;
}[] = [
  { value: "compact", label: "S", description: "コンパクト（最大3列）" },
  { value: "standard", label: "M", description: "標準（最大2列）" },
  { value: "large", label: "L", description: "ラージ（縦型）" },
  { value: "xl", label: "XL", description: "エクストララージ（大きめ画像）" },
];

export function getProductSize(block: Block): ProductSize {
  const raw = block.data.product_size ?? "standard";
  if (raw === "banner") return "xl";
  return raw;
}

export function getGridMaxColumns(size: "compact" | "standard"): number {
  return size === "compact" ? 3 : 2;
}

export type GridSegmentSize = "compact" | "standard" | "text";

export function getPairLayout(block: Block): "row" | "stack" | undefined {
  if (block.data.pair_layout) return block.data.pair_layout;
  if (block.type === "product" && block.data.product_pair_layout) {
    return block.data.product_pair_layout;
  }
  return undefined;
}

export function getGridBlockKind(block: Block): GridSegmentSize | null {
  if (block.type === "text") return "text";
  if (block.type === "product") {
    const size = getProductSize(block);
    if (size === "compact" || size === "standard") return size;
  }
  return null;
}

/** S/M 商品またはテキスト — 横並びグリッドに配置できるブロック */
export function isGridBlock(block: Block): boolean {
  return getGridBlockKind(block) !== null;
}

export function canPairTogether(first: Block, second: Block): boolean {
  const a = getGridBlockKind(first);
  const b = getGridBlockKind(second);
  return a !== null && a === b;
}

export function getGridMaxColumnsForKind(kind: GridSegmentSize): number {
  return kind === "compact" ? 3 : 2;
}

export function blocksEqual(a: Block[], b: Block[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (block, index) =>
      block.id === b[index]?.id &&
      block.type === b[index]?.type &&
      JSON.stringify(block.data) === JSON.stringify(b[index]?.data),
  );
}
