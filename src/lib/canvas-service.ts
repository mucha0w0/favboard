import { migrateCanvasBlocks } from "@/lib/bento";
import { normalizeCanvas } from "@/lib/canvas-utils";
import { createClient } from "@/lib/supabase/server";
import { createSlug } from "@/lib/slug";
import { type Block, type Canvas } from "@/lib/types";

export async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function listCanvases(userId: string): Promise<Canvas[]> {
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
  const supabase = await createClient();
  const { error } = await supabase
    .from("canvases")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}
