import type { ImageCrop } from "@/lib/types";
import type { CSSProperties } from "react";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MIN_CROP_FRACTION = 0.05;

/** Bento 商品セルの画像表示部に近い縦横比（幅/高さ） */
export function getProductImageCropAspect(
  cellSpan?: { colSpan: number; rowSpan: number },
): number {
  if (!cellSpan) return 1;

  const cellAspect = cellSpan.colSpan / Math.max(1, cellSpan.rowSpan);
  if (cellAspect >= 2) return 1;

  const imageHeightFraction = 1.4 / (1.4 + 1);
  return cellAspect / imageHeightFraction;
}

export function defaultImageCrop(
  imageWidth: number,
  imageHeight: number,
  aspectRatio: number,
): ImageCrop {
  const imageAspect = imageWidth / imageHeight;
  let width: number;
  let height: number;

  if (imageAspect > aspectRatio) {
    height = 1;
    width = aspectRatio / imageAspect;
  } else {
    width = 1;
    height = imageAspect / aspectRatio;
  }

  return clampImageCrop({
    x: (1 - width) / 2,
    y: (1 - height) / 2,
    width,
    height,
  });
}

export function clampImageCrop(crop: ImageCrop): ImageCrop {
  const width = Math.min(1, Math.max(MIN_CROP_FRACTION, crop.width));
  const height = Math.min(1, Math.max(MIN_CROP_FRACTION, crop.height));
  const x = Math.min(1 - width, Math.max(0, crop.x));
  const y = Math.min(1 - height, Math.max(0, crop.y));
  return { x, y, width, height };
}

export function getContainedImageBounds(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): Rect {
  const scale = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight,
  );
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
  };
}

export function cropToScreenRect(crop: ImageCrop, bounds: Rect): Rect {
  return {
    x: bounds.x + crop.x * bounds.width,
    y: bounds.y + crop.y * bounds.height,
    width: crop.width * bounds.width,
    height: crop.height * bounds.height,
  };
}

export function screenRectToCrop(screen: Rect, bounds: Rect): ImageCrop {
  return clampImageCrop({
    x: (screen.x - bounds.x) / bounds.width,
    y: (screen.y - bounds.y) / bounds.height,
    width: screen.width / bounds.width,
    height: screen.height / bounds.height,
  });
}

export function constrainScreenRect(
  rect: Rect,
  bounds: Rect,
  aspect: number,
  minWidth: number,
): Rect {
  let width = Math.max(minWidth, rect.width);
  let height = width / aspect;

  if (height > bounds.height) {
    height = Math.max(minWidth / aspect, bounds.height);
    width = height * aspect;
  }

  if (width > bounds.width) {
    width = bounds.width;
    height = width / aspect;
  }

  let x = rect.x;
  let y = rect.y;

  if (x < bounds.x) x = bounds.x;
  if (y < bounds.y) y = bounds.y;
  if (x + width > bounds.x + bounds.width) {
    x = bounds.x + bounds.width - width;
  }
  if (y + height > bounds.y + bounds.height) {
    y = bounds.y + bounds.height - height;
  }

  return { x, y, width, height };
}

export function getCroppedImageStyle(crop: ImageCrop): CSSProperties {
  return {
    width: `${100 / crop.width}%`,
    height: `${100 / crop.height}%`,
    left: `${(-crop.x / crop.width) * 100}%`,
    top: `${(-crop.y / crop.height) * 100}%`,
    maxWidth: "none",
  };
}
