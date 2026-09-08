"use client";

import { ExternalLink, Package } from "lucide-react";
import Image from "next/image";
import { normalizeImageUrl } from "./styles";

function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

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

export function ProductOfficialLink({ url }: { url: string }) {
  return (
    <a
      href={normalizeExternalUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[12px] text-stone-600 underline underline-offset-2 transition-colors hover:text-stone-900"
    >
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
      公式サイトに移動
    </a>
  );
}

export function ProductExtras({
  comment,
  officialUrl,
}: {
  comment?: string;
  officialUrl?: string;
}) {
  const hasComment = Boolean(comment?.trim());
  const hasOfficialUrl = Boolean(officialUrl?.trim());
  if (!hasComment && !hasOfficialUrl) return null;

  return (
    <div className="mt-3 space-y-1">
      {hasComment && (
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-stone-500">
          {comment}
        </p>
      )}
      {hasOfficialUrl && officialUrl && (
        <ProductOfficialLink url={officialUrl} />
      )}
    </div>
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
  officialUrl,
  gapClass = "gap-4 sm:gap-5",
  showExtras = true,
  showOfficialLink = false,
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
  officialUrl?: string;
  gapClass?: string;
  showExtras?: boolean;
  showOfficialLink?: boolean;
  lineClamp?: number;
}) {
  const extrasComment = showExtras ? comment : undefined;
  const extrasOfficialUrl = showOfficialLink ? officialUrl : undefined;
  const showProductExtras =
    Boolean(extrasComment?.trim()) || Boolean(extrasOfficialUrl?.trim());

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
        {showProductExtras && (
          <ProductExtras
            comment={extrasComment}
            officialUrl={extrasOfficialUrl}
          />
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
  officialUrl,
  showExtras = true,
  showOfficialLink = false,
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
  officialUrl?: string;
  showExtras?: boolean;
  showOfficialLink?: boolean;
  lineClamp?: number;
}) {
  const extrasComment = showExtras ? comment : undefined;
  const extrasOfficialUrl = showOfficialLink ? officialUrl : undefined;
  const showProductExtras =
    Boolean(extrasComment?.trim()) || Boolean(extrasOfficialUrl?.trim());

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
        {showProductExtras && (
          <ProductExtras
            comment={extrasComment}
            officialUrl={extrasOfficialUrl}
          />
        )}
      </div>
    </div>
  );
}
