"use client";

import { getProductSizeFromPlacement } from "@/lib/bento-layout";
import { getProductSize, type Block, type ProductSize } from "@/lib/types";
import { ArrowUpRight, Package } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ProductBlockProps {
  block: Block;
  showPlaceholders?: boolean;
  layout?: "inline" | "grid";
  cellSpan?: { colSpan: number; rowSpan: number };
}

function normalizeImageUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

function displayValue(
  value: string | undefined,
  placeholder: string,
  showPlaceholders: boolean,
): string {
  if (value?.trim()) return value.trim();
  return showPlaceholders ? placeholder : "—";
}

function ProductImage({
  showImage,
  imageUrl,
  title,
  onError,
  className,
}: {
  showImage: boolean;
  imageUrl?: string;
  title?: string;
  onError: () => void;
  className: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-stone-100 ${className}`}
    >
      {showImage && imageUrl ? (
        <Image
          src={normalizeImageUrl(imageUrl)}
          alt={title || "商品"}
          fill
          className="object-cover transition-transform duration-500 ease-out hover:scale-[1.03]"
          sizes="(max-width: 720px) 100vw, 720px"
          unoptimized
          onError={onError}
        />
      ) : (
        <div className="flex h-full min-h-12 w-full items-center justify-center text-stone-300">
          <Package className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

function ProductMeta({
  brandText,
  titleText,
  priceText,
  brand,
  title,
  price,
  titleClass = "text-sm",
  vertical = false,
  lineClamp,
}: {
  brandText: string;
  titleText: string;
  priceText: string;
  brand?: string;
  title?: string;
  price?: string;
  titleClass?: string;
  vertical?: boolean;
  lineClamp?: number;
}) {
  const clampClass =
    lineClamp === 2
      ? "line-clamp-2"
      : lineClamp === 3
        ? "line-clamp-3"
        : undefined;

  return (
    <div className={vertical ? "space-y-1" : "min-w-0 space-y-0.5"}>
      <p
        className={`truncate text-[10px] font-medium uppercase tracking-[0.12em] ${
          brand?.trim() ? "text-stone-400" : "text-stone-300"
        }`}
      >
        {brandText}
      </p>
      <h3
        className={`font-medium tracking-tight ${titleClass} ${clampClass ?? ""} ${
          title?.trim() ? "text-stone-900" : "text-stone-300"
        }`}
      >
        {titleText}
      </h3>
      <p
        className={`text-xs tabular-nums ${
          price?.trim() ? "text-stone-600" : "text-stone-300"
        }`}
      >
        {priceText}
      </p>
    </div>
  );
}

function ProductExtras({
  comment,
  product_url,
}: {
  comment?: string;
  product_url?: string;
}) {
  return (
    <>
      {comment?.trim() && (
        <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-stone-500">
          {comment}
        </p>
      )}
      {product_url && (
        <a
          href={product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="product-link mt-3 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone-400"
          onClick={(e) => e.stopPropagation()}
        >
          公式ページを見る
          <ArrowUpRight className="h-3 w-3" />
        </a>
      )}
    </>
  );
}

const PRODUCT_SIZE_STYLES: Record<
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

function ProductHorizontal({
  showImage,
  imageUrl,
  title,
  onImageError,
  imageClassName,
  brandText,
  titleText,
  priceText,
  brand,
  price,
  titleClass,
  comment,
  product_url,
  gapClass = "gap-4 sm:gap-5",
  showExtras = true,
  lineClamp,
  imagePosition = "left",
}: {
  showImage: boolean;
  imageUrl?: string;
  title?: string;
  onImageError: () => void;
  imageClassName: string;
  brandText: string;
  titleText: string;
  priceText: string;
  brand?: string;
  price?: string;
  titleClass?: string;
  comment?: string;
  product_url?: string;
  gapClass?: string;
  showExtras?: boolean;
  lineClamp?: number;
  imagePosition?: "left" | "right";
}) {
  return (
    <div
      className={`group flex h-full min-h-0 items-center ${gapClass} ${
        imagePosition === "right" ? "flex-row-reverse" : ""
      }`}
    >
      <ProductImage
        showImage={showImage}
        imageUrl={imageUrl}
        title={title}
        onError={onImageError}
        className={imageClassName}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center">
        <ProductMeta
          brandText={brandText}
          titleText={titleText}
          priceText={priceText}
          brand={brand}
          title={title}
          price={price}
          titleClass={titleClass}
          lineClamp={lineClamp}
        />
        {showExtras && (
          <ProductExtras comment={comment} product_url={product_url} />
        )}
      </div>
    </div>
  );
}

function ProductVertical({
  showImage,
  imageUrl,
  title,
  onImageError,
  imageClassName,
  brandText,
  titleText,
  priceText,
  brand,
  price,
  titleClass,
  comment,
  product_url,
  showExtras = true,
  lineClamp,
}: {
  showImage: boolean;
  imageUrl?: string;
  title?: string;
  onImageError: () => void;
  imageClassName: string;
  brandText: string;
  titleText: string;
  priceText: string;
  brand?: string;
  price?: string;
  titleClass?: string;
  comment?: string;
  product_url?: string;
  showExtras?: boolean;
  lineClamp?: number;
}) {
  return (
    <div className="group flex h-full min-h-0 flex-col">
      <ProductImage
        showImage={showImage}
        imageUrl={imageUrl}
        title={title}
        onError={onImageError}
        className={imageClassName}
      />
      <div className="mt-1.5 shrink-0">
        <ProductMeta
          brandText={brandText}
          titleText={titleText}
          priceText={priceText}
          brand={brand}
          title={title}
          price={price}
          titleClass={titleClass}
          vertical
          lineClamp={lineClamp}
        />
        {showExtras && (
          <ProductExtras comment={comment} product_url={product_url} />
        )}
      </div>
    </div>
  );
}

const GRID_SIZE_STYLES: Record<
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
function shouldUseVerticalLayout(
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
function resolveImagePosition(
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

function ProductCardContent({
  block,
  showPlaceholders,
  size,
  layout,
  cellSpan,
}: {
  block: Block;
  showPlaceholders: boolean;
  size: ProductSize;
  layout: "inline" | "grid";
  cellSpan?: { colSpan: number; rowSpan: number };
}) {
  const { title, brand, price, image_url, product_url, comment } = block.data;
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(image_url && !imageError);

  const brandText = displayValue(brand, "ブランド名", showPlaceholders);
  const titleText = displayValue(title, "商品名", showPlaceholders);
  const priceText = displayValue(price, "¥ —", showPlaceholders);
  const onImageError = () => setImageError(true);

  const shared = {
    showImage,
    imageUrl: image_url,
    title,
    onImageError,
    brandText,
    titleText,
    priceText,
    brand,
    price,
    comment,
    product_url,
  };

  const effectiveSize =
    layout === "grid" && cellSpan
      ? getProductSizeFromPlacement(cellSpan.colSpan, cellSpan.rowSpan)
      : size;
  const gridStyles = GRID_SIZE_STYLES[effectiveSize];
  const inlineStyles = PRODUCT_SIZE_STYLES[effectiveSize];
  const useVertical = shouldUseVerticalLayout(layout, effectiveSize, cellSpan);
  const imageClass =
    layout === "grid"
      ? useVertical
        ? gridStyles.imageClass
        : (gridStyles.horizontalImageClass ?? gridStyles.imageClass)
      : inlineStyles.imageClass;
  const titleClass =
    layout === "grid" ? gridStyles.titleClass : inlineStyles.titleClass;
  const gapClass = layout === "grid" ? gridStyles.gapClass : undefined;
  const showExtras = layout === "grid" ? gridStyles.showExtras : true;
  const lineClamp = layout === "grid" ? gridStyles.lineClamp : undefined;
  const styleImagePosition =
    layout === "grid"
      ? gridStyles.imagePosition
      : inlineStyles.imagePosition;
  const imagePosition = resolveImagePosition(
    layout,
    effectiveSize,
    cellSpan,
    styleImagePosition,
  );

  const layoutProps = {
    ...shared,
    imageClassName: imageClass,
    titleClass,
    showExtras,
    lineClamp,
  };

  if (useVertical) {
    return <ProductVertical {...layoutProps} />;
  }

  return (
    <ProductHorizontal
      {...layoutProps}
      gapClass={layout === "grid" ? gapClass : undefined}
      imagePosition={imagePosition}
    />
  );
}

export function ProductBlock({
  block,
  showPlaceholders = false,
  layout = "inline",
  cellSpan,
}: ProductBlockProps) {
  const size = getProductSize(block);

  return (
    <div className={layout === "grid" ? "block-product h-full min-h-0" : "block-product"}>
      <ProductCardContent
        block={block}
        showPlaceholders={showPlaceholders}
        size={size}
        layout={layout}
        cellSpan={cellSpan}
      />
    </div>
  );
}
