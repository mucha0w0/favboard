import type { BentoCellPlacement, BentoChildType } from "@/lib/types";

export const BENTO_COLS = 12;
export const DEFAULT_BENTO_ROWS = 6;
export const MIN_BENTO_ROWS = 2;
export const MAX_BENTO_ROWS = 48;

export const LEGACY_BENTO_COLS = 6;

export const DEFAULT_CHILD_SIZE: Record<
  BentoChildType,
  Pick<BentoCellPlacement, "colSpan" | "rowSpan">
> = {
  product: { colSpan: 2, rowSpan: 2 },
  text: { colSpan: 6, rowSpan: 1 },
};
