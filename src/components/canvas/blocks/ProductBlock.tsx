"use client";

import { type Block } from "@/lib/types";
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

export function ProductBlock({
  block,
  showPlaceholders = false,
}: ProductBlockProps) {
  const { title, brand, price, image_url, product_url, comment } = block.data;
  const [imageError, setImageError] = useState(false);

  const showImage = image_url && !imageError;
  const brandText = displayValue(brand, "ブランド名", showPlaceholders);
  const titleText = displayValue(title, "商品名", showPlaceholders);
  const priceText = displayValue(price, "¥ —", showPlaceholders);

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] w-full bg-stone-100">
        {showImage ? (
          <Image
            src={normalizeImageUrl(image_url!)}
            alt={title || "商品"}
            fill
            className="object-cover"
            sizes="(max-width: 680px) 100vw, 680px"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-300">
            <Package className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="space-y-1.5 p-4 sm:p-5">
        <p
          className={`text-xs font-medium uppercase tracking-wide ${
            brand?.trim() ? "text-stone-500" : "text-stone-300"
          }`}
        >
          {brandText}
        </p>
        <h3
          className={`text-base font-semibold leading-snug ${
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
      </div>
    </div>
  );
}
