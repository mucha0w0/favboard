import { migrateCanvasBlocks } from "@/lib/bento";
import { normalizeCanvas } from "@/lib/canvas-utils";
import { isSupabaseConfigured } from "@/lib/config";
import {
  localCreateCanvas,
  localDeleteCanvas,
  localGetCanvasBySlug,
  localGetCanvasBySlugForView,
  localGetCanvasWithAccess,
  localListCanvases,
  localUpdateCanvas,
} from "@/lib/local/store";
import { createClient } from "@/lib/supabase/server";
import { createSlug } from "@/lib/slug";
import { type Block, type Canvas } from "@/lib/types";

export async function getAuthUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    const { getLocalSessionUserId } = await import("@/lib/local/session");
    return getLocalSessionUserId();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function listCanvases(userId: string): Promise<Canvas[]> {
  if (!isSupabaseConfigured()) {
    return (await localListCanvases(userId)).map(normalizeCanvas);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("canvases")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Canvas[]).map(normalizeCanvas);
}

export async function createCanvas(
  userId: string,
  title: string,
): Promise<Canvas> {
  if (!isSupabaseConfigured()) {
    return normalizeCanvas(await localCreateCanvas(userId, title));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("canvases")
    .insert({
      user_id: userId,
      title,
      slug: createSlug(),
      blocks: [] as Block[],
      is_published: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return normalizeCanvas(data as Canvas);
}

export async function getCanvasForView(
  id: string,
  userId: string | null,
): Promise<Canvas | null> {
  if (!isSupabaseConfigured()) {
    const canvas = await localGetCanvasWithAccess(id, userId);
    return canvas ? normalizeCanvas(canvas) : null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("canvases")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) return null;
  const canvas = data as Canvas;
  if (!canvas.is_published && canvas.user_id !== userId) return null;
  return normalizeCanvas(canvas);
}

export async function getPublishedCanvasBySlug(
  slug: string,
): Promise<Canvas | null> {
  if (!isSupabaseConfigured()) {
    const canvas = await localGetCanvasBySlug(slug);
    return canvas ? normalizeCanvas(canvas) : null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("canvases")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  return data ? normalizeCanvas(data as Canvas) : null;
}

export async function getCanvasBySlugForView(
  slug: string,
  userId: string | null,
): Promise<Canvas | null> {
  if (!isSupabaseConfigured()) {
    const canvas = await localGetCanvasBySlugForView(slug, userId);
    return canvas ? normalizeCanvas(canvas) : null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("canvases")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!data) return null;
  const canvas = data as Canvas;
  if (!canvas.is_published && canvas.user_id !== userId) return null;
  return normalizeCanvas(canvas);
}

export async function updateCanvas(
  id: string,
  userId: string,
  updates: Partial<Pick<Canvas, "title" | "blocks" | "is_published">>,
): Promise<Canvas | null> {
  const normalizedUpdates = {
    ...updates,
    ...(updates.blocks
      ? { blocks: migrateCanvasBlocks(updates.blocks) }
      : {}),
  };

  if (!isSupabaseConfigured()) {
    const canvas = await localUpdateCanvas(id, userId, normalizedUpdates);
    return canvas ? normalizeCanvas(canvas) : null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("canvases")
    .update(normalizedUpdates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data ? normalizeCanvas(data as Canvas) : null;
}

export async function deleteCanvas(
  id: string,
  userId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return localDeleteCanvas(id, userId);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("canvases")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}
