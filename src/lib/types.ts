export type BlockType = "product" | "heading" | "divider";

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
  text?: string;
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
