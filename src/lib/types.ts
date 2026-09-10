export type BlockType = "product" | "heading" | "divider" | "text" | "bento";

/** トップレベルに置けるブロック */
export type TopLevelBlockType = "heading" | "divider" | "text" | "bento";

/** Bento 内に置けるブロック */
export type BentoChildType = "product" | "text";

export type ProductSize = "compact" | "standard" | "large" | "xl";

export type PriceCurrency = "¥" | "$";

export const DEFAULT_PRICE_CURRENCY: PriceCurrency = "¥";

/** 価格入力から通貨記号などを除き、数値・カンマ・小数点のみ残す */
export function sanitizePriceInput(value: string): string {
  return value.replace(/[^\d.,]/g, "");
}

/** 保存済み価格を金額と通貨に分解（旧データ互換） */
export function parseStoredPrice(
  price?: string,
  currency?: PriceCurrency,
): { amount: string; currency: PriceCurrency } {
  if (currency === "$" || currency === "¥") {
    return { amount: sanitizePriceInput(price ?? ""), currency };
  }
  const raw = (price ?? "").trim();
  if (raw.startsWith("$") || raw.startsWith("＄")) {
    return { amount: sanitizePriceInput(raw.slice(1)), currency: "$" };
  }
  if (raw.startsWith("¥") || raw.startsWith("￥")) {
    return { amount: sanitizePriceInput(raw.slice(1)), currency: "¥" };
  }
  return { amount: sanitizePriceInput(raw), currency: DEFAULT_PRICE_CURRENCY };
}

export function formatProductPrice(
  price?: string,
  currency?: PriceCurrency,
): string | undefined {
  const { amount, currency: resolved } = parseStoredPrice(price, currency);
  if (!amount) return undefined;
  return `${resolved}${amount}`;
}

/** @deprecated Legacy bento layout — ignored */
export interface BlockLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Bento 内グリッド上の配置（24列ベース） */
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
  /** 金額（数値・カンマ・小数点のみ）。通貨は price_currency */
  price?: string;
  /** 価格の通貨記号。未設定時は ¥ */
  price_currency?: PriceCurrency;
  image_url?: string;
  /** 公式サイト URL */
  official_url?: string;
  comment?: string;
  product_size?: ProductSize | "banner";
  /** Bento コンテナ */
  bento_rows?: number;
  /** 保存時の列数（未設定は旧 12 列としてマイグレート） */
  bento_cols?: number;
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

export function isTopLevelBlockType(type: BlockType): type is TopLevelBlockType {
  return (
    type === "heading" ||
    type === "divider" ||
    type === "text" ||
    type === "bento"
  );
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
