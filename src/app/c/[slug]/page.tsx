import { PublicCanvasView } from "@/components/canvas/PublicCanvasView";
import {
  getAuthUserId,
  getCanvasBySlugForView,
  getPublishedCanvasBySlug,
} from "@/lib/canvas-service";
import { findFirstProductImage } from "@/lib/canvas-utils";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const canvas = await getPublishedCanvasBySlug(slug);
  if (!canvas) return { title: "Not Found" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${appUrl}/c/${slug}`;
  const ogImage = findFirstProductImage(canvas.blocks);

  return {
    title: canvas.title,
    description: `${canvas.title} — 物欲・こだわりのビジュアルポートフォリオ`,
    openGraph: {
      title: canvas.title,
      description: "Visual Wishlist Canvas — 純粋な物欲のポートフォリオ",
      url: shareUrl,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: canvas.title,
      description: "Visual Wishlist Canvas",
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function PublicCanvasPage({ params }: PageProps) {
  const { slug } = await params;
  const userId = await getAuthUserId();
  const canvas = await getCanvasBySlugForView(slug, userId);

  if (!canvas) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${appUrl}/c/${slug}`;

  return (
    <PublicCanvasView
      canvas={canvas}
      shareUrl={shareUrl}
      isDraftPreview={!canvas.is_published}
    />
  );
}
