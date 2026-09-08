"use client";

import { getProductSizeFromPlacement } from "@/lib/bento";
import { getProductSize, type Block, type ProductSize } from "@/lib/types";
import { useState } from "react";
import { ProductHorizontal, ProductVertical } from "./product/ProductParts";
import {
  GRID_SIZE_STYLES,
  PRODUCT_SIZE_STYLES,
  displayValue,
  shouldUseVerticalLayout,
} from "./product/styles";

interface ProductBlockProps {
  block: Block;
  showPlaceholders?: boolean;
  layout?: "inline" | "grid";
  cellSpan?: { colSpan: number; rowSpan: number };
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
  const { title, brand, price, image_url, comment } = block.data;
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
        : gridStyles.horizontalImageClass
      : inlineStyles.imageClass;
  const titleClass =
    layout === "grid" ? gridStyles.titleClass : inlineStyles.titleClass;
  const gapClass = layout === "grid" ? gridStyles.gapClass : undefined;
  const showExtras = layout === "grid" ? gridStyles.showExtras : true;
  const lineClamp = layout === "grid" ? gridStyles.lineClamp : undefined;

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
    <div
      className={
        layout === "grid" ? "block-product h-full min-h-0" : "block-product"
      }
    >
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
