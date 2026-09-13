import { migrateCanvasBlocks } from "@/lib/bento";
import {
  CANVAS_LIMIT_MESSAGE,
  MAX_CANVASES_PER_USER,
  normalizeCanvas,
} from "@/lib/canvas-utils";
import { createClient } from "@/lib/supabase/server";
import { createSlug } from "@/lib/slug";
import { type Block, type Canvas } from "@/lib/types";

export class CanvasError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CanvasError";
  }
}

function isCanvasLimitError(error: { code?: string; message?: string }): boolean {
  const message = error.message ?? "";
  return (
    error.code === "P0001" ||
    message.includes(CANVAS_LIMIT_MESSAGE) ||
    /canvas.?limit/i.test(message)
  );
}

/** One client per request so getUser() refresh is visible to subsequent RLS queries. */
async function getServerClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await getServerClient();
  return userId;
}

export async function listCanvases(userId: string): Promise<Canvas[]> {
  const { supabase } = await getServerClient();
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
  const { supabase } = await getServerClient();
  const { count, error: countError } = await supabase
    .from("canvases")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) >= MAX_CANVASES_PER_USER) {
    throw new CanvasError(CANVAS_LIMIT_MESSAGE, 403);
  }

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

  if (error) {
    if (isCanvasLimitError(error)) {
      throw new CanvasError(CANVAS_LIMIT_MESSAGE, 403);
    }
    throw new Error(error.message);
  }
  return normalizeCanvas(data as Canvas);
}

export async function getCanvasForView(
  id: string,
  userId: string | null,
): Promise<Canvas | null> {
  const { supabase, userId: sessionUserId } = await getServerClient();
  const viewerId = sessionUserId ?? userId;
  const { data, error } = await supabase
    .from("canvases")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const canvas = data as Canvas;
  if (!canvas.is_published && canvas.user_id !== viewerId) return null;
  return normalizeCanvas(canvas);
}

export async function getCanvasForEdit(id: string): Promise<{
  userId: string | null;
  canvas: Canvas | null;
}> {
  const { supabase, userId } = await getServerClient();
  if (!userId) return { userId: null, canvas: null };

  const { data, error } = await supabase
    .from("canvases")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return { userId, canvas: null };

  const canvas = data as Canvas;
  if (canvas.user_id !== userId) return { userId, canvas: null };
  return { userId, canvas: normalizeCanvas(canvas) };
}

export async function getPublishedCanvasBySlug(
  slug: string,
): Promise<Canvas | null> {
  const { supabase } = await getServerClient();
  const { data, error } = await supabase
    .from("canvases")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? normalizeCanvas(data as Canvas) : null;
}

export async function getCanvasBySlugForView(
  slug: string,
  userId: string | null,
): Promise<Canvas | null> {
  const { supabase, userId: sessionUserId } = await getServerClient();
  const viewerId = sessionUserId ?? userId;
  const { data, error } = await supabase
    .from("canvases")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const canvas = data as Canvas;
  if (!canvas.is_published && canvas.user_id !== viewerId) return null;
  return normalizeCanvas(canvas);
}

export async function updateCanvas(
  id: string,
  updates: Partial<Pick<Canvas, "title" | "blocks" | "is_published">>,
): Promise<Canvas | null> {
  const normalizedUpdates = {
    ...updates,
    ...(updates.blocks
      ? { blocks: migrateCanvasBlocks(updates.blocks) }
      : {}),
  };

  const { supabase, userId } = await getServerClient();
  if (!userId) throw new CanvasError("Unauthorized", 401);

  const { data, error } = await supabase
    .from("canvases")
    .update(normalizedUpdates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? normalizeCanvas(data as Canvas) : null;
}

export async function deleteCanvas(id: string): Promise<boolean> {
  const { supabase, userId } = await getServerClient();
  if (!userId) throw new CanvasError("Unauthorized", 401);

  const { error } = await supabase
    .from("canvases")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}
