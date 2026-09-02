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
    <div className="space-y-0.5">
      <p
        className={`text-xs ${
          brand?.trim() ? "text-stone-400" : "text-stone-300"
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
        className={`text-xs font-medium ${
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
        <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-stone-500">
          {comment}
        </p>
      )}
      {product_url && (
        <a
          href={product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3" />
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
        <div className="flex gap-3 p-3">
          <ProductImage
            showImage={showImage}
            imageUrl={image_url}
            title={title}
            onError={() => setImageError(true)}
            className="h-16 w-16 rounded-md"
          />
          <div className="min-w-0 flex-1">
            <ProductMeta
              brandText={brandText}
              titleText={titleText}
              priceText={priceText}
              brand={brand}
              title={title}
              price={price}
              titleClass="text-xs"
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
            className="aspect-4/5 w-full"
          />
          <div className="space-y-1 p-3 sm:p-4">
            <ProductMeta
              brandText={brandText}
              titleText={titleText}
              priceText={priceText}
              brand={brand}
              title={title}
              price={price}
              titleClass="text-base"
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
            className="aspect-3/1 w-full"
          />
          <div className="space-y-1 p-3 sm:p-4">
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
            className="aspect-3/2 w-full"
          />
          <div className="space-y-1 p-3 sm:p-4">
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
    <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
      <ProductCardContent
        block={block}
        showPlaceholders={showPlaceholders}
        size={size}
      />
    </div>
  );
}
