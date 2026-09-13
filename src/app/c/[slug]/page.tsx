import { PublicCanvasView } from "@/components/canvas/PublicCanvasView";
import {
  getCanvasBySlugForView,
  getPublishedCanvasBySlug,
} from "@/lib/canvas-service";
import { canvasShareUrl } from "@/lib/canvas-utils";
import { getProfileById } from "@/lib/profile-service";
import { type Profile } from "@/lib/types";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const canvas = await getPublishedCanvasBySlug(slug);
    if (!canvas) return { title: "Not Found" };

    const shareUrl = canvasShareUrl(slug);

    return {
      title: canvas.title,
      description: `${canvas.title} — Favboard（ファブボード）`,
      openGraph: {
        title: canvas.title,
        description: "Favboard — 好きを集めるビジュアルボード",
        url: shareUrl,
        siteName: "Favboard",
        locale: "ja_JP",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: canvas.title,
        description: "Favboard（ファブボード）",
      },
    };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function PublicCanvasPage({ params }: PageProps) {
  const { slug } = await params;
  let canvas = null;
  try {
    canvas = await getCanvasBySlugForView(slug, null);
  } catch {
    notFound();
  }

  if (!canvas) notFound();

  const shareUrl = canvasShareUrl(slug);
  let creator: Profile | null = null;
  try {
    creator = await getProfileById(canvas.user_id);
  } catch {
    creator = null;
  }

  return (
    <PublicCanvasView
      canvas={canvas}
      creator={creator}
      shareUrl={shareUrl}
      isDraftPreview={!canvas.is_published}
    />
  );
}
