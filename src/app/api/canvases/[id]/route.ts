import {
  deleteCanvas,
  getAuthUserId,
  getCanvasForView,
  updateCanvas,
} from "@/lib/canvas-service";
import { type Canvas } from "@/lib/types";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const userId = await getAuthUserId();
  const canvas = await getCanvasForView(id, userId);

  if (!canvas) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(canvas);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const userId = await getAuthUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Partial<Pick<Canvas, "title" | "blocks" | "is_published">> =
    {};

  if (typeof body === "object" && body !== null) {
    const b = body as Record<string, unknown>;
    if (typeof b.title === "string") updates.title = b.title;
    if (Array.isArray(b.blocks)) updates.blocks = b.blocks;
    if (typeof b.is_published === "boolean")
      updates.is_published = b.is_published;
  }

  try {
    const data = await updateCanvas(id, userId, updates);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const userId = await getAuthUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ok = await deleteCanvas(id, userId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
