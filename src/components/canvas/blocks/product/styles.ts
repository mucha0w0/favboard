import type { ProductSize } from "@/lib/types";

export const PRODUCT_SIZE_STYLES: Record<
  ProductSize,
  {
    imageClass: string;
    titleClass: string;
    vertical?: boolean;
  }
> = {
  compact: {
    imageClass: "h-16 w-16 sm:h-20 sm:w-20",
    titleClass: "text-xs leading-tight",
  },
  standard: {
    imageClass: "h-28 w-28 sm:h-32 sm:w-32",
    titleClass: "text-sm leading-snug",
  },
  large: {
    imageClass: "aspect-[4/5] w-full max-w-[240px]",
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
    /** 上下構成（写真上）向け */
    imageClass: string;
    /** 左右構成（写真左）向け */
    horizontalImageClass: string;
    titleClass: string;
    gapClass?: string;
    showExtras?: boolean;
    lineClamp?: number;
  }
> = {
  compact: {
    imageClass: "min-h-0 w-full flex-[1.4]",
    horizontalImageClass: "h-full max-h-full aspect-square w-auto max-w-[58%]",
    titleClass: "text-[10px] leading-tight",
    gapClass: "gap-1.5",
    showExtras: false,
    lineClamp: 3,
  },
  standard: {
    imageClass: "min-h-0 w-full flex-[1.5]",
    horizontalImageClass: "h-full max-h-full aspect-square w-auto max-w-[58%]",
    titleClass: "text-xs leading-snug",
    gapClass: "gap-2",
    showExtras: false,
    lineClamp: 3,
  },
  large: {
    imageClass: "min-h-0 w-full flex-[1.6]",
    horizontalImageClass:
      "h-full max-h-full aspect-square w-auto max-w-[60%]",
    titleClass: "text-xs leading-snug",
    gapClass: "gap-2.5",
    showExtras: true,
    lineClamp: 2,
  },
  xl: {
    imageClass: "min-h-0 w-full flex-[1.8]",
    horizontalImageClass:
      "h-full max-h-full aspect-square w-auto max-w-[62%]",
    titleClass: "text-sm leading-snug",
    gapClass: "gap-3",
    showExtras: true,
    lineClamp: 3,
  },
};

/** セル縦横比が 1:2（横長）以上 → 左右、それ未満 → 上下 */
export function shouldUseVerticalLayout(
  layout: "inline" | "grid",
  effectiveSize: ProductSize,
  cellSpan?: { colSpan: number; rowSpan: number },
): boolean {
  if (layout === "grid" && cellSpan) {
    const aspect = cellSpan.colSpan / Math.max(1, cellSpan.rowSpan);
    return aspect < 2;
  }

  return effectiveSize === "large" || effectiveSize === "xl";
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
