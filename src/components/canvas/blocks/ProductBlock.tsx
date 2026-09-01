"use client";

import { getProductSize, type Block, type ProductSize } from "@/lib/types";
import { ExternalLink, Package } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ProductBlockProps {
  block: Block;
  showPlaceholders?: boolean;
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
    <div className={`relative shrink-0 overflow-hidden bg-stone-100 ${className}`}>
      {showImage && imageUrl ? (
        <Image
          src={normalizeImageUrl(imageUrl)}
          alt={title || "商品"}
          fill
          className="object-cover"
          sizes="(max-width: 680px) 100vw, 680px"
          unoptimized
          onError={onError}
        />
      ) : (
        <div className="flex h-full min-h-[80px] w-full items-center justify-center text-stone-300">
          <Package className="h-8 w-8" />
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
  titleClass = "text-base",
}: {
  brandText: string;
  titleText: string;
  priceText: string;
  brand?: string;
  title?: string;
  price?: string;
  titleClass?: string;
}) {
  return (
    <div className="space-y-1">
      <p
        className={`text-xs font-medium uppercase tracking-wide ${
          brand?.trim() ? "text-stone-500" : "text-stone-300"
        }`}
      >
        {brandText}
      </p>
      <h3
        className={`font-semibold leading-snug ${titleClass} ${
          title?.trim() ? "text-stone-900" : "text-stone-300"
        }`}
      >
        {titleText}
      </h3>
      <p
        className={`text-sm font-medium ${
          price?.trim() ? "text-stone-800" : "text-stone-300"
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
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-500">
          {comment}
        </p>
      )}
      {product_url && (
        <a
          href={product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          公式ページを見る
        </a>
      )}
    </>
  );
}

function ProductCardContent({
  block,
  showPlaceholders,
  size,
}: {
  block: Block;
  showPlaceholders: boolean;
  size: ProductSize;
}) {
  const { title, brand, price, image_url, product_url, comment } = block.data;
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(image_url && !imageError);

  const brandText = displayValue(brand, "ブランド名", showPlaceholders);
  const titleText = displayValue(title, "商品名", showPlaceholders);
  const priceText = displayValue(price, "¥ —", showPlaceholders);

  switch (size) {
    case "compact":
      return (
        <div className="flex gap-4 p-4">
          <ProductImage
            showImage={showImage}
            imageUrl={image_url}
            title={title}
            onError={() => setImageError(true)}
            className="h-24 w-24 rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <ProductMeta
              brandText={brandText}
              titleText={titleText}
              priceText={priceText}
              brand={brand}
              title={title}
              price={price}
              titleClass="text-sm"
            />
            <ProductExtras comment={comment} product_url={product_url} />
          </div>
        </div>
      );

    case "large":
      return (
        <>
          <ProductImage
            showImage={showImage}
            imageUrl={image_url}
            title={title}
            onError={() => setImageError(true)}
            className="aspect-[3/4] w-full"
          />
          <div className="space-y-1.5 p-5">
            <ProductMeta
              brandText={brandText}
              titleText={titleText}
              priceText={priceText}
              brand={brand}
              title={title}
              price={price}
              titleClass="text-lg"
            />
            <ProductExtras comment={comment} product_url={product_url} />
          </div>
        </>
      );

    case "banner":
      return (
        <>
          <ProductImage
            showImage={showImage}
            imageUrl={image_url}
            title={title}
            onError={() => setImageError(true)}
            className="aspect-[21/9] w-full"
          />
          <div className="space-y-1.5 p-4 sm:p-5">
            <ProductMeta
              brandText={brandText}
              titleText={titleText}
              priceText={priceText}
              brand={brand}
              title={title}
              price={price}
            />
            <ProductExtras comment={comment} product_url={product_url} />
          </div>
        </>
      );

    case "standard":
    default:
      return (
        <>
          <ProductImage
            showImage={showImage}
            imageUrl={image_url}
            title={title}
            onError={() => setImageError(true)}
            className="aspect-[4/3] w-full"
          />
          <div className="space-y-1.5 p-4 sm:p-5">
            <ProductMeta
              brandText={brandText}
              titleText={titleText}
              priceText={priceText}
              brand={brand}
              title={title}
              price={price}
            />
            <ProductExtras comment={comment} product_url={product_url} />
          </div>
        </>
      );
  }
}

export function ProductBlock({
  block,
  showPlaceholders = false,
}: ProductBlockProps) {
  const size = getProductSize(block);

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <ProductCardContent
        block={block}
        showPlaceholders={showPlaceholders}
        size={size}
      />
    </div>
  );
}
