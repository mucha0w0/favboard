import { getPublishedCanvasBySlug } from "@/lib/canvas-service";
import { renderCanvasOgImage } from "@/lib/og-image";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Favboard";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";
/** Cache generated OG images; invalidated on publish/update via revalidatePath. */
export const revalidate = 3600;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canvas = await getPublishedCanvasBySlug(slug);
  return renderCanvasOgImage(canvas);
}
