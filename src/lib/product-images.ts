import type { Block } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const PRODUCT_IMAGES_BUCKET = "product-images";

const PUBLIC_OBJECT_MARKER = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;

export type ProductImageUpload = {
  body: Blob | ArrayBuffer | Uint8Array;
  contentType: string;
  extension: string;
};

/** Collect every product image_url (nested Bento children included). */
export function collectAllProductImageUrls(blocks: Block[]): string[] {
  const urls: string[] = [];

  const visit = (items: Block[]) => {
    for (const block of items) {
      if (block.type === "product") {
        const url = block.data.image_url?.trim();
        if (url) urls.push(url);
      } else if (block.type === "bento") {
        visit(block.data.children ?? []);
      }
    }
  };

  visit(blocks);
  return urls;
}

export function isDataImageUrl(url: string): boolean {
  return /^data:image\//i.test(url.trim());
}

export function isProductStorageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed, "http://localhost");
    return parsed.pathname.includes(PUBLIC_OBJECT_MARKER);
  } catch {
    return trimmed.includes(PUBLIC_OBJECT_MARKER);
  }
}

/** Object path inside the bucket, or null if not our public URL. */
export function productStoragePathFromUrl(url: string): string | null {
  const trimmed = url.trim();
  const idx = trimmed.indexOf(PUBLIC_OBJECT_MARKER);
  if (idx < 0) return null;
  const path = decodeURIComponent(
    trimmed.slice(idx + PUBLIC_OBJECT_MARKER.length).split("?")[0] ?? "",
  );
  return path || null;
}

export function productStoragePublicUrl(
  supabaseUrl: string,
  objectPath: string,
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}${PUBLIC_OBJECT_MARKER}${objectPath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function extensionFromMime(mime: string): string {
  if (mime.includes("webp")) return "webp";
  if (mime.includes("png")) return "png";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

function parseDataUrl(dataUrl: string): {
  contentType: string;
  bytes: Uint8Array;
  extension: string;
} | null {
  const match = dataUrl
    .trim()
    .match(/^data:(image\/[a-z0-9+.-]+);base64,([a-z0-9+/]+=*)$/i);
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return {
    contentType,
    bytes,
    extension: extensionFromMime(contentType),
  };
}

export async function uploadProductImageBlob(
  supabase: SupabaseClient,
  userId: string,
  image: ProductImageUpload,
): Promise<string> {
  const objectPath = `${userId}/${crypto.randomUUID()}.${image.extension}`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(objectPath, image.body, {
      contentType: image.contentType,
      upsert: false,
      cacheControl: "31536000",
    });

  if (error) {
    throw new Error(error.message || "画像のアップロードに失敗しました");
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(objectPath);

  return data.publicUrl;
}

export async function deleteProductStorageUrls(
  supabase: SupabaseClient,
  urls: string[],
): Promise<void> {
  const paths = [
    ...new Set(
      urls
        .map(productStoragePathFromUrl)
        .filter((path): path is string => Boolean(path)),
    ),
  ];
  if (paths.length === 0) return;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove(paths);

  if (error) {
    console.error("Failed to delete product images:", error.message);
  }
}

/** Upload data-URL product images to Storage and rewrite blocks. */
export async function migrateProductDataUrlsInBlocks(
  supabase: SupabaseClient,
  userId: string,
  blocks: Block[],
): Promise<Block[]> {
  const mapBlock = async (block: Block): Promise<Block> => {
    if (block.type === "bento") {
      const children = block.data.children ?? [];
      const nextChildren = await Promise.all(children.map(mapBlock));
      return {
        ...block,
        data: { ...block.data, children: nextChildren },
      };
    }

    if (block.type !== "product") return block;

    const imageUrl = block.data.image_url?.trim() ?? "";
    if (!isDataImageUrl(imageUrl)) return block;

    const parsed = parseDataUrl(imageUrl);
    if (!parsed) return block;

    const publicUrl = await uploadProductImageBlob(supabase, userId, {
      body: parsed.bytes,
      contentType: parsed.contentType,
      extension: parsed.extension,
    });

    return {
      ...block,
      data: { ...block.data, image_url: publicUrl },
    };
  };

  return Promise.all(blocks.map(mapBlock));
}

export async function deleteAllProductImagesForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .list(userId, { limit: 1000 });

  if (error) {
    console.error("Failed to list product images:", error.message);
    return;
  }

  const paths = (data ?? [])
    .filter((item) => item.name && !item.name.endsWith("/"))
    .map((item) => `${userId}/${item.name}`);

  if (paths.length === 0) return;

  const { error: removeError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove(paths);

  if (removeError) {
    console.error("Failed to delete user product images:", removeError.message);
  }
}
