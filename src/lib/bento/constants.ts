import type { BentoCellPlacement, BentoChildType } from "@/lib/types";

export const BENTO_COLS = 24;
export const DEFAULT_BENTO_ROWS = 12;
export const MIN_BENTO_ROWS = 4;
export const MAX_BENTO_ROWS = 96;

/** 旧 6 列グリッド（さらに旧） */
export const LEGACY_BENTO_COLS_6 = 6;
/** 旧 12 列グリッド */
export const LEGACY_BENTO_COLS_12 = 12;

/** @deprecated Use LEGACY_BENTO_COLS_6 */
export const LEGACY_BENTO_COLS = LEGACY_BENTO_COLS_6;

export const DEFAULT_CHILD_SIZE: Record<
  BentoChildType,
  Pick<BentoCellPlacement, "colSpan" | "rowSpan">
> = {
  product: { colSpan: 4, rowSpan: 4 },
  text: { colSpan: 3, rowSpan: 4 },
};
