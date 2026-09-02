"use client";

import { getProductSize, type Block, type ProductSize } from "@/lib/types";
import { ArrowUpRight, Package } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ProductBlockProps {
  block: Block;
  showPlaceholders?: boolean;
  layout?: "inline" | "grid";
  gridSize?: "compact" | "standard";
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
}: {
  brandText: string;
  titleText: string;
  priceText: string;
  brand?: string;
  title?: string;
  price?: string;
  titleClass?: string;
  vertical?: boolean;
}) {
  return (
    <div className={vertical ? "space-y-1.5" : "space-y-0.5"}>
      <p
        className={`text-[10px] font-medium uppercase tracking-[0.12em] ${
          brand?.trim() ? "text-stone-400" : "text-stone-300"
        }`}
      >
        {brandText}
      </p>
      <h3
        className={`font-medium leading-snug tracking-tight ${titleClass} ${
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
  { imageClass: string; titleClass: string; vertical?: boolean }
> = {
  compact: {
    imageClass: "h-16 w-16",
    titleClass: "text-xs leading-tight",
  },
  standard: {
    imageClass: "h-24 w-24 sm:h-28 sm:w-28",
    titleClass: "text-sm leading-snug",
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
}) {
  return (
    <div className="group flex gap-4 sm:gap-5">
      <ProductImage
        showImage={showImage}
        imageUrl={imageUrl}
        title={title}
        onError={onImageError}
        className={imageClassName}
      />
      <div className="min-w-0 flex-1 pt-0.5">
        <ProductMeta
          brandText={brandText}
          titleText={titleText}
          priceText={priceText}
          brand={brand}
          title={title}
          price={price}
          titleClass={titleClass}
        />
        <ProductExtras comment={comment} product_url={product_url} />
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
}) {
  return (
    <div className="group space-y-4">
      <ProductImage
        showImage={showImage}
        imageUrl={imageUrl}
        title={title}
        onError={onImageError}
        className={imageClassName}
      />
      <div>
        <ProductMeta
          brandText={brandText}
          titleText={titleText}
          priceText={priceText}
          brand={brand}
          title={title}
          price={price}
          titleClass={titleClass}
          vertical
        />
        <ProductExtras comment={comment} product_url={product_url} />
      </div>
    </div>
  );
}

function ProductCardContent({
  block,
  showPlaceholders,
  size,
  layout,
  gridSize,
}: {
  block: Block;
  showPlaceholders: boolean;
  size: ProductSize;
  layout: "inline" | "grid";
  gridSize?: "compact" | "standard";
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

  const effectiveSize = layout === "grid" ? (gridSize ?? size) : size;
  const { imageClass, titleClass, vertical } =
    PRODUCT_SIZE_STYLES[effectiveSize];

  if (vertical && layout === "inline") {
    return (
      <ProductVertical
        {...shared}
        imageClassName={imageClass}
        titleClass={titleClass}
      />
    );
  }

  return (
    <ProductHorizontal
      {...shared}
      imageClassName={imageClass}
      titleClass={titleClass}
    />
  );
}

export function ProductBlock({
  block,
  showPlaceholders = false,
  layout = "inline",
  gridSize,
}: ProductBlockProps) {
  const size = getProductSize(block);

  return (
    <ProductCardContent
      block={block}
      showPlaceholders={showPlaceholders}
      size={size}
      layout={layout}
      gridSize={gridSize}
    />
  );
}
