import { isSupabaseConfigured } from "@/lib/config";
import {
  localCreateCanvas,
  localDeleteCanvas,
  localGetCanvasBySlug,
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
    return localListCanvases(userId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("canvases")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Canvas[];
}

export async function createCanvas(
  userId: string,
  title: string,
): Promise<Canvas> {
  if (!isSupabaseConfigured()) {
    return localCreateCanvas(userId, title);
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
  return data as Canvas;
}

export async function getCanvasForView(
  id: string,
  userId: string | null,
): Promise<Canvas | null> {
  if (!isSupabaseConfigured()) {
    return localGetCanvasWithAccess(id, userId);
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
  return canvas;
}

export async function getPublishedCanvasBySlug(
  slug: string,
): Promise<Canvas | null> {
  if (!isSupabaseConfigured()) {
    return localGetCanvasBySlug(slug);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("canvases")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  return (data as Canvas) ?? null;
}

export async function updateCanvas(
  id: string,
  userId: string,
  updates: Partial<Pick<Canvas, "title" | "blocks" | "is_published">>,
): Promise<Canvas | null> {
  if (!isSupabaseConfigured()) {
    return localUpdateCanvas(id, userId, updates);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("canvases")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Canvas;
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
