import { createSlug } from "@/lib/slug";
import { type Block, type Canvas } from "@/lib/types";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "canvases.json");

interface StoreData {
  canvases: Canvas[];
}

async function ensureStore(): Promise<StoreData> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as StoreData;
  } catch {
    const empty: StoreData = { canvases: [] };
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
}

async function saveStore(data: StoreData) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function localListCanvases(userId: string): Promise<Canvas[]> {
  const store = await ensureStore();
  return store.canvases
    .filter((c) => c.user_id === userId)
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
}

export async function localCreateCanvas(
  userId: string,
  title: string,
): Promise<Canvas> {
  const store = await ensureStore();
  const now = new Date().toISOString();
  const canvas: Canvas = {
    id: crypto.randomUUID(),
    user_id: userId,
    title,
    slug: createSlug(),
    blocks: [],
    is_published: false,
    created_at: now,
    updated_at: now,
  };
  store.canvases.push(canvas);
  await saveStore(store);
  return canvas;
}

export async function localGetCanvas(id: string): Promise<Canvas | null> {
  const store = await ensureStore();
  return store.canvases.find((c) => c.id === id) ?? null;
}

export async function localGetCanvasBySlug(
  slug: string,
): Promise<Canvas | null> {
  const store = await ensureStore();
  return (
    store.canvases.find((c) => c.slug === slug && c.is_published) ?? null
  );
}

export async function localGetCanvasBySlugForView(
  slug: string,
  userId: string | null,
): Promise<Canvas | null> {
  const store = await ensureStore();
  const canvas = store.canvases.find((c) => c.slug === slug) ?? null;
  if (!canvas) return null;
  if (!canvas.is_published && canvas.user_id !== userId) return null;
  return canvas;
}

export async function localUpdateCanvas(
  id: string,
  userId: string,
  updates: Partial<Pick<Canvas, "title" | "blocks" | "is_published">>,
): Promise<Canvas | null> {
  const store = await ensureStore();
  const index = store.canvases.findIndex(
    (c) => c.id === id && c.user_id === userId,
  );
  if (index === -1) return null;

  const updated: Canvas = {
    ...store.canvases[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  store.canvases[index] = updated;
  await saveStore(store);
  return updated;
}

export async function localDeleteCanvas(
  id: string,
  userId: string,
): Promise<boolean> {
  const store = await ensureStore();
  const before = store.canvases.length;
  store.canvases = store.canvases.filter(
    (c) => !(c.id === id && c.user_id === userId),
  );
  if (store.canvases.length === before) return false;
  await saveStore(store);
  return true;
}

export async function localGetCanvasWithAccess(
  id: string,
  userId: string | null,
): Promise<Canvas | null> {
  const canvas = await localGetCanvas(id);
  if (!canvas) return null;
  if (!canvas.is_published && canvas.user_id !== userId) return null;
  return canvas;
}

export type { Block };
