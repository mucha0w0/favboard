import {
  CanvasError,
  deleteCanvas,
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
  try {
    const canvas = await getCanvasForView(id, null);
    if (!canvas) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(canvas);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

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
    const data = await updateCanvas(id, updates);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof CanvasError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const ok = await deleteCanvas(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof CanvasError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
