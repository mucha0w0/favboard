import type { ProductSize } from "@/lib/types";

export const PRODUCT_SIZE_STYLES: Record<
  ProductSize,
  {
    imageClass: string;
    titleClass: string;
    vertical?: boolean;
    imagePosition?: "left" | "right";
  }
> = {
  compact: {
    imageClass: "h-14 w-14 sm:h-16 sm:w-16",
    titleClass: "text-xs leading-tight",
    imagePosition: "right",
  },
  standard: {
    imageClass: "h-24 w-24 sm:h-28 sm:w-28",
    titleClass: "text-sm leading-snug",
    imagePosition: "left",
  },
  large: {
    imageClass: "aspect-[4/5] w-full max-w-[200px]",
    titleClass: "text-base leading-snug",
    vertical: true,
  },
  xl: {
    imageClass: "aspect-[3/4] w-full",
    titleClass: "text-lg leading-snug sm:text-xl",
    vertical: true,
  },
};

export const GRID_SIZE_STYLES: Record<
  ProductSize,
  {
    imageClass: string;
    horizontalImageClass?: string;
    titleClass: string;
    vertical?: boolean;
    gapClass?: string;
    showExtras?: boolean;
    lineClamp?: number;
    imagePosition?: "left" | "right";
  }
> = {
  compact: {
    imageClass: "h-full max-h-full aspect-square w-auto max-w-[32%]",
    titleClass: "text-[10px] leading-tight",
    gapClass: "gap-1",
    showExtras: false,
    lineClamp: 3,
    imagePosition: "right",
  },
  standard: {
    imageClass: "h-full max-h-full aspect-square w-auto max-w-[40%]",
    titleClass: "text-xs leading-snug",
    gapClass: "gap-1.5",
    showExtras: false,
    lineClamp: 3,
    imagePosition: "left",
  },
  large: {
    imageClass: "min-h-0 w-full flex-1",
    horizontalImageClass:
      "h-full max-h-full aspect-[4/5] w-auto max-w-[46%]",
    titleClass: "text-xs leading-snug",
    vertical: true,
    gapClass: "gap-2",
    showExtras: true,
    lineClamp: 2,
    imagePosition: "left",
  },
  xl: {
    imageClass: "min-h-0 w-full flex-1",
    horizontalImageClass:
      "h-full max-h-full aspect-[3/4] w-auto max-w-[48%]",
    titleClass: "text-sm leading-snug",
    vertical: true,
    gapClass: "gap-2.5",
    showExtras: true,
    lineClamp: 3,
    imagePosition: "left",
  },
};

/** グリッドセルの縦横比に応じて横並び / 縦並びを決定 */
export function shouldUseVerticalLayout(
  layout: "inline" | "grid",
  effectiveSize: ProductSize,
  cellSpan?: { colSpan: number; rowSpan: number },
): boolean {
  if (effectiveSize === "compact" || effectiveSize === "standard") return false;

  if (layout === "inline") {
    return effectiveSize === "large" || effectiveSize === "xl";
  }

  if (!cellSpan) return true;
  return cellSpan.rowSpan > cellSpan.colSpan;
}

/** 横並び時の写真位置 — 小さいセルはテキスト優先で右寄せ */
export function resolveImagePosition(
  layout: "inline" | "grid",
  effectiveSize: ProductSize,
  cellSpan?: { colSpan: number; rowSpan: number },
  styleDefault?: "left" | "right",
): "left" | "right" {
  if (effectiveSize === "compact") return "right";

  if (
    layout === "grid" &&
    cellSpan &&
    effectiveSize === "standard" &&
    cellSpan.rowSpan > cellSpan.colSpan
  ) {
    return "right";
  }

  return styleDefault ?? "left";
}

export function normalizeImageUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

export function displayValue(
  value: string | undefined,
  placeholder: string,
  showPlaceholders: boolean,
): string {
  if (value?.trim()) return value.trim();
  return showPlaceholders ? placeholder : "—";
}
