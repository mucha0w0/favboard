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
  { value: "compact", label: "S", description: "コンパクト（横並び）" },
  { value: "standard", label: "M", description: "標準（横並び）" },
  { value: "large", label: "L", description: "ラージ（縦型）" },
  { value: "xl", label: "XL", description: "エクストララージ（大きめ画像）" },
];

export function getProductSize(block: Block): ProductSize {
  const raw = block.data.product_size ?? "standard";
  if (raw === "banner") return "xl";
  return raw;
}
