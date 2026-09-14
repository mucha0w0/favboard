const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.72;
const WEBP_QUALITY = 0.75;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = src;
  });
}

function canvasToImageBlob(
  canvas: HTMLCanvasElement,
): Promise<{ blob: Blob; contentType: string; extension: string }> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.type === "image/webp") {
          resolve({
            blob: webpBlob,
            contentType: "image/webp",
            extension: "webp",
          });
          return;
        }
        canvas.toBlob(
          (jpegBlob) => {
            if (!jpegBlob) {
              reject(new Error("画像の処理に失敗しました"));
              return;
            }
            resolve({
              blob: jpegBlob,
              contentType: "image/jpeg",
              extension: "jpg",
            });
          },
          "image/jpeg",
          JPEG_QUALITY,
        );
      },
      "image/webp",
      WEBP_QUALITY,
    );
  });
}

const AVATAR_SIZE = 320;
const MAX_AVATAR_FILE_BYTES = 8 * 1024 * 1024;

async function resizeImageToCanvas(
  file: File | Blob,
): Promise<HTMLCanvasElement> {
  if (!file.type.startsWith("image/")) {
    throw new Error("画像ファイルを選択してください");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("画像の処理に失敗しました");
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function imageFileToProductBlob(
  file: File | Blob,
): Promise<{ blob: Blob; contentType: string; extension: string }> {
  const canvas = await resizeImageToCanvas(file);
  return canvasToImageBlob(canvas);
}

export async function imageFileToAvatarBlob(
  file: File | Blob,
): Promise<{ blob: Blob; contentType: string; extension: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("画像ファイルを選択してください");
  }
  if ("size" in file && file.size > MAX_AVATAR_FILE_BYTES) {
    throw new Error("画像が大きすぎます（8MBまで）");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = (img.height - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("画像の処理に失敗しました");
    ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

    return canvasToImageBlob(canvas);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function getClipboardImageFile(
  clipboardData: DataTransfer | null,
): File | null {
  if (!clipboardData) return null;

  for (const item of clipboardData.items) {
    if (item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }

  return null;
}

/** next/image can optimize http(s) and local public paths, not data/blob URLs. */
export function shouldUnoptimizeImageSrc(src: string): boolean {
  const trimmed = src.trim();
  return (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.length === 0
  );
}
