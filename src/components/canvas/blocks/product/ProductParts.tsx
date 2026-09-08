"use client";

import { ArrowUpRight, Package } from "lucide-react";
import Image from "next/image";
import { normalizeImageUrl } from "./styles";

export function ProductImage({
  showImage,
  imageUrl,
  title,
  onError,
  className,
  shrink = true,
}: {
  showImage: boolean;
  imageUrl?: string;
  title?: string;
  onError: () => void;
  className: string;
  /** 上下構成で flex 伸縮させるときは false */
  shrink?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-stone-100 ${shrink ? "shrink-0" : "min-h-0"} ${className}`}
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

export function ProductMeta({
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

export function ProductExtras({
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

export function ProductHorizontal({
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
}) {
  return (
    <div className={`group flex h-full min-h-0 items-center ${gapClass}`}>
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

export function ProductVertical({
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
    <div className="group flex h-full min-h-0 flex-col gap-1.5">
      <ProductImage
        showImage={showImage}
        imageUrl={imageUrl}
        title={title}
        onError={onImageError}
        className={imageClassName}
        shrink={false}
      />
      <div className="min-h-0 shrink-0">
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
