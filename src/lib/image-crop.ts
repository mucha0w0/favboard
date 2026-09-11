import type { ImageCrop } from "@/lib/types";
import type { CSSProperties } from "react";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MIN_CROP_FRACTION = 0.05;

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

/** 画像上の切り取り範囲の表示縦横比（幅/高さ） */
export function cropDisplayAspect(
  crop: ImageCrop,
  imageWidth: number,
  imageHeight: number,
): number {
  return (crop.width / crop.height) * (imageWidth / imageHeight);
}

export function cropMatchesAspect(
  crop: ImageCrop,
  imageWidth: number,
  imageHeight: number,
  aspectRatio: number,
  epsilon = 0.005,
): boolean {
  return (
    Math.abs(
      cropDisplayAspect(crop, imageWidth, imageHeight) - aspectRatio,
    ) < epsilon
  );
}

/** 中心を保ちつけ、新しい表示縦横比に合わせて切り取り範囲を再計算 */
export function adaptCropToAspect(
  crop: ImageCrop,
  imageWidth: number,
  imageHeight: number,
  aspectRatio: number,
): ImageCrop {
  const imageAspect = imageWidth / imageHeight;
  const cx = crop.x + crop.width / 2;
  const cy = crop.y + crop.height / 2;

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
    x: cx - width / 2,
    y: cy - height / 2,
    width,
    height,
  });
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

export type CropResizeHandle =
  | "move"
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "s"
  | "e"
  | "w";

/** 左上を固定して幅・高さを境界内に収める */
function fitSizeAnchorNW(
  anchorX: number,
  anchorY: number,
  width: number,
  bounds: Rect,
  aspect: number,
  minWidth: number,
): Rect {
  const maxW = bounds.x + bounds.width - anchorX;
  const maxH = bounds.y + bounds.height - anchorY;

  let w = Math.max(minWidth, width);
  let h = w / aspect;

  if (w > maxW) {
    w = maxW;
    h = w / aspect;
  }
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }

  w = Math.max(minWidth, Math.min(w, maxW));
  h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = Math.max(minWidth, h * aspect);
    h = w / aspect;
  }

  return { x: anchorX, y: anchorY, width: w, height: h };
}

/** 右下を固定して幅・高さを境界内に収める */
function fitSizeAnchorSE(
  anchorRight: number,
  anchorBottom: number,
  width: number,
  bounds: Rect,
  aspect: number,
  minWidth: number,
): Rect {
  const maxW = anchorRight - bounds.x;
  const maxH = anchorBottom - bounds.y;

  let w = Math.max(minWidth, width);
  let h = w / aspect;

  if (w > maxW) {
    w = maxW;
    h = w / aspect;
  }
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }

  w = Math.max(minWidth, Math.min(w, maxW));
  h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = Math.max(minWidth, h * aspect);
    h = w / aspect;
  }

  return {
    x: anchorRight - w,
    y: anchorBottom - h,
    width: w,
    height: h,
  };
}

/** 右上を固定して幅・高さを境界内に収める */
function fitSizeAnchorNE(
  anchorRight: number,
  anchorY: number,
  width: number,
  bounds: Rect,
  aspect: number,
  minWidth: number,
): Rect {
  const maxW = anchorRight - bounds.x;
  const maxH = bounds.y + bounds.height - anchorY;

  let w = Math.max(minWidth, width);
  let h = w / aspect;

  if (w > maxW) {
    w = maxW;
    h = w / aspect;
  }
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }

  w = Math.max(minWidth, Math.min(w, maxW));
  h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = Math.max(minWidth, h * aspect);
    h = w / aspect;
  }

  return { x: anchorRight - w, y: anchorY, width: w, height: h };
}

/** 左下を固定して幅・高さを境界内に収める */
function fitSizeAnchorSW(
  anchorX: number,
  anchorBottom: number,
  width: number,
  bounds: Rect,
  aspect: number,
  minWidth: number,
): Rect {
  const maxW = bounds.x + bounds.width - anchorX;
  const maxH = anchorBottom - bounds.y;

  let w = Math.max(minWidth, width);
  let h = w / aspect;

  if (w > maxW) {
    w = maxW;
    h = w / aspect;
  }
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }

  w = Math.max(minWidth, Math.min(w, maxW));
  h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = Math.max(minWidth, h * aspect);
    h = w / aspect;
  }

  return { x: anchorX, y: anchorBottom - h, width: w, height: h };
}

function fitMove(rect: Rect, bounds: Rect): Rect {
  const x = Math.max(
    bounds.x,
    Math.min(rect.x, bounds.x + bounds.width - rect.width),
  );
  const y = Math.max(
    bounds.y,
    Math.min(rect.y, bounds.y + bounds.height - rect.height),
  );
  return { x, y, width: rect.width, height: rect.height };
}

/** ハンドル操作に応じてトリミング枠を更新（反対側の辺・角を固定） */
export function resizeScreenRect(
  mode: CropResizeHandle,
  startRect: Rect,
  dx: number,
  dy: number,
  bounds: Rect,
  aspect: number,
  minWidth: number,
): Rect {
  const startRight = startRect.x + startRect.width;
  const startBottom = startRect.y + startRect.height;

  if (mode === "move") {
    return fitMove(
      {
        x: startRect.x + dx,
        y: startRect.y + dy,
        width: startRect.width,
        height: startRect.height,
      },
      bounds,
    );
  }

  switch (mode) {
    case "se":
      return fitSizeAnchorNW(
        startRect.x,
        startRect.y,
        startRect.width + dx,
        bounds,
        aspect,
        minWidth,
      );
    case "nw":
      return fitSizeAnchorSE(
        startRight,
        startBottom,
        startRect.width - dx,
        bounds,
        aspect,
        minWidth,
      );
    case "ne":
      return fitSizeAnchorSW(
        startRect.x,
        startBottom,
        startRect.width + dx,
        bounds,
        aspect,
        minWidth,
      );
    case "sw":
      return fitSizeAnchorNE(
        startRight,
        startRect.y,
        startRect.width - dx,
        bounds,
        aspect,
        minWidth,
      );
    case "e":
      return fitSizeAnchorNW(
        startRect.x,
        startRect.y,
        startRect.width + dx,
        bounds,
        aspect,
        minWidth,
      );
    case "w":
      return fitSizeAnchorNE(
        startRight,
        startRect.y,
        startRect.width - dx,
        bounds,
        aspect,
        minWidth,
      );
    case "s":
      return fitSizeAnchorNW(
        startRect.x,
        startRect.y,
        (startRect.height + dy) * aspect,
        bounds,
        aspect,
        minWidth,
      );
    case "n":
      return fitSizeAnchorSW(
        startRect.x,
        startBottom,
        (startRect.height - dy) * aspect,
        bounds,
        aspect,
        minWidth,
      );
    default:
      return startRect;
  }
}

export type CroppedImageLayout = {
  width: number;
  height: number;
  left: number;
  top: number;
};

/** 切り取り範囲を歪めずにコンテナを覆う（object-fit: cover 相当） */
export function computeCroppedImageLayout(
  crop: ImageCrop,
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): CroppedImageLayout {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return { width: 0, height: 0, left: 0, top: 0 };
  }

  const cropPixelW = crop.width * imageWidth;
  const cropPixelH = crop.height * imageHeight;
  const scale = Math.max(
    containerWidth / cropPixelW,
    containerHeight / cropPixelH,
  );

  return {
    width: imageWidth * scale,
    height: imageHeight * scale,
    left: -crop.x * imageWidth * scale,
    top: -crop.y * imageHeight * scale,
  };
}

export function croppedImageLayoutToStyle(
  layout: CroppedImageLayout,
): CSSProperties {
  return {
    position: "absolute",
    width: layout.width,
    height: layout.height,
    left: layout.left,
    top: layout.top,
    maxWidth: "none",
  };
}
