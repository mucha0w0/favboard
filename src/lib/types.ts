export type BlockType = "product" | "heading" | "divider" | "text" | "bento";

/** トップレベルに置けるブロック */
export type TopLevelBlockType = "heading" | "divider" | "bento";

/** Bento 内に置けるブロック */
export type BentoChildType = "product" | "text";

export type ProductSize = "compact" | "standard" | "large" | "xl";

/** @deprecated Legacy bento layout — ignored */
export interface BlockLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Bento 内グリッド上の配置（12列ベース） */
export interface BentoCellPlacement {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  /** @deprecated 旧データ互換 — 読み取り時は無視し rowSpan のみ使用 */
  sizeRowSpan?: number;
}

export interface BlockData {
  /** 見出し */
  text?: string;
  /** テキスト本文 */
  body?: string;
  /** 商品 */
  title?: string;
  brand?: string;
  price?: string;
  image_url?: string;
  product_url?: string;
  comment?: string;
  product_size?: ProductSize | "banner";
  /** Bento コンテナ */
  bento_rows?: number;
  children?: Block[];
  child_placements?: Record<string, BentoCellPlacement>;
}

export interface Block {
  id: string;
  type: BlockType;
  data: BlockData;
  /** @deprecated */
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

export function isTopLevelBlockType(type: BlockType): type is TopLevelBlockType {
  return type === "heading" || type === "divider" || type === "bento";
}

export function isBentoChildType(type: BlockType): type is BentoChildType {
  return type === "product" || type === "text";
}

export function getProductSize(block: Block): ProductSize {
  const raw = block.data.product_size ?? "standard";
  if (raw === "banner") return "xl";
  return raw;
}

export function blocksEqual(a: Block[], b: Block[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function blockDataEqual(a: BlockData, b: BlockData): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
