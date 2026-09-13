import { CanvasEditor } from "@/components/canvas/CanvasEditor";
import { getCanvasForEdit } from "@/lib/canvas-service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCanvasPage({ params }: PageProps) {
  const { id } = await params;

  let userId: string | null = null;
  let canvas = null;
  try {
    const result = await getCanvasForEdit(id);
    userId = result.userId;
    canvas = result.canvas;
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
        <p className="text-sm text-stone-500">
          ボードを読み込めませんでした。ページを再読み込みしてください。
        </p>
      </div>
    );
  }

  if (!userId) redirect(`/login?redirect=/edit/${id}`);
  if (!canvas) redirect("/dashboard");

  return <CanvasEditor canvas={canvas} />;
}
