import { type OgpData } from "@/lib/types";
import ogs from "open-graph-scraper";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
    }

    const { result, error } = await ogs({
      url: parsed.toString(),
      timeout: 10000,
      fetchOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; WishlistCanvasBot/1.0; +https://wishlist-canvas.app)",
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch OGP data" },
        { status: 422 },
      );
    }

    const ogImages = result.ogImage;
    const ogImageUrl = Array.isArray(ogImages)
      ? ogImages[0]?.url
      : ogImages && typeof ogImages === "object" && "url" in ogImages
        ? String((ogImages as { url?: string }).url)
        : undefined;

    const ogp: OgpData = {
      title: result.ogTitle || result.twitterTitle || result.dcTitle,
      image: ogImageUrl || result.twitterImage?.[0]?.url,
      description:
        result.ogDescription ||
        result.twitterDescription ||
        result.dcDescription,
      siteName: result.ogSiteName,
    };

    return NextResponse.json(ogp);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch OGP data" },
      { status: 500 },
    );
  }
}
