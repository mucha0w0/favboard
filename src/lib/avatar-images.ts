import { isDataImageUrl } from "@/lib/product-images";
import type { SupabaseClient } from "@supabase/supabase-js";

export const AVATARS_BUCKET = "avatars";

const PUBLIC_OBJECT_MARKER = `/storage/v1/object/public/${AVATARS_BUCKET}/`;

export type AvatarImageUpload = {
  body: Blob | ArrayBuffer | Uint8Array;
  contentType: string;
  extension: string;
};

export function isAvatarStorageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed, "http://localhost");
    return parsed.pathname.includes(PUBLIC_OBJECT_MARKER);
  } catch {
    return trimmed.includes(PUBLIC_OBJECT_MARKER);
  }
}

export function avatarStoragePathFromUrl(url: string): string | null {
  const trimmed = url.trim();
  const idx = trimmed.indexOf(PUBLIC_OBJECT_MARKER);
  if (idx < 0) return null;
  const path = decodeURIComponent(
    trimmed.slice(idx + PUBLIC_OBJECT_MARKER.length).split("?")[0] ?? "",
  );
  return path || null;
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

export async function uploadAvatarImage(
  supabase: SupabaseClient,
  userId: string,
  image: AvatarImageUpload,
): Promise<string> {
  await deleteAllAvatarsForUser(supabase, userId);

  const objectPath = `${userId}/avatar.${image.extension}`;
  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(objectPath, image.body, {
      contentType: image.contentType,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(error.message || "プロフィール画像のアップロードに失敗しました");
  }

  const { data } = supabase.storage
    .from(AVATARS_BUCKET)
    .getPublicUrl(objectPath);

  // Bust CDN/browser cache after upsert to the same path.
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function deleteAvatarStorageUrl(
  supabase: SupabaseClient,
  url: string | null | undefined,
): Promise<void> {
  if (!url || !isAvatarStorageUrl(url)) return;
  const path = avatarStoragePathFromUrl(url);
  if (!path) return;

  const { error } = await supabase.storage.from(AVATARS_BUCKET).remove([path]);
  if (error) {
    console.error("Failed to delete avatar:", error.message);
  }
}

export async function deleteAllAvatarsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .list(userId, { limit: 100 });

  if (error) {
    console.error("Failed to list avatars:", error.message);
    return;
  }

  const paths = (data ?? [])
    .filter((item) => item.name && !item.name.endsWith("/"))
    .map((item) => `${userId}/${item.name}`);

  if (paths.length === 0) return;

  const { error: removeError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .remove(paths);

  if (removeError) {
    console.error("Failed to delete user avatars:", removeError.message);
  }
}

/** Convert legacy data-URL avatars to Storage on profile save. */
export async function migrateAvatarDataUrl(
  supabase: SupabaseClient,
  userId: string,
  avatarUrl: string | null,
): Promise<string | null> {
  if (!avatarUrl) return null;
  if (!isDataImageUrl(avatarUrl)) return avatarUrl;

  const parsed = parseDataUrl(avatarUrl);
  if (!parsed) return avatarUrl;

  return uploadAvatarImage(supabase, userId, {
    body: parsed.bytes,
    contentType: parsed.contentType,
    extension: parsed.extension,
  });
}
