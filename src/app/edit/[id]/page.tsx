import { CanvasEditor } from "@/components/canvas/CanvasEditor";
import { getAuthUserId, getCanvasForView } from "@/lib/canvas-service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCanvasPage({ params }: PageProps) {
  const { id } = await params;
  const userId = await getAuthUserId();

  if (!userId) redirect("/login");

  const canvas = await getCanvasForView(id, userId);
  if (!canvas || canvas.user_id !== userId) {
    redirect("/dashboard");
  }

  return <CanvasEditor canvas={canvas} />;
}
