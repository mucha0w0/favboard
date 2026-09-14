import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const OG_PANEL_WIDTH = 504;
const OG_PANEL_HEIGHT = 630;

function googleFontCssUrl(family: string, weight: number, text: string) {
  const params = new URLSearchParams({
    family: `${family}:wght@${weight}`,
    text,
  });
  return `https://fonts.googleapis.com/css2?${params.toString()}`;
}

const fontCache = new Map<string, ArrayBuffer>();

export async function loadNotoSansJp(
  text: string,
  weight: 400 | 600 | 700,
): Promise<ArrayBuffer | null> {
  const cacheKey = `${weight}:${text}`;
  if (fontCache.has(cacheKey)) return fontCache.get(cacheKey)!;

  try {
    const css = await fetch(googleFontCssUrl("Noto Sans JP", weight, text), {
      headers: {
        // Request TTF so Satori can subset CJK glyphs.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    }).then((res) => (res.ok ? res.text() : ""));
    const match = css.match(
      /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/,
    );
    if (!match?.[1]) return null;
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    const data = await fontRes.arrayBuffer();
    fontCache.set(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

export async function loadOgFonts(text: string) {
  const unique = Array.from(new Set([...text, ..."Favboardファブボード"])).join(
    "",
  );
  const [regular, bold] = await Promise.all([
    loadNotoSansJp(unique, 400),
    loadNotoSansJp(unique, 700),
  ]);
  const fonts: {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 700;
    style: "normal";
  }[] = [];
  if (regular) {
    fonts.push({
      name: "Noto Sans JP",
      data: regular,
      weight: 400,
      style: "normal",
    });
  }
  if (bold) {
    fonts.push({
      name: "Noto Sans JP",
      data: bold,
      weight: 700,
      style: "normal",
    });
  }
  return fonts;
}

export function truncateOgTitle(title: string, max = 36): string {
  const chars = Array.from(title.trim() || "Favboard");
  if (chars.length <= max) return chars.join("");
  return `${chars.slice(0, max).join("")}…`;
}

async function readImageBytes(src: string): Promise<Buffer | null> {
  if (src.startsWith("data:")) {
    const comma = src.indexOf(",");
    if (comma < 0) return null;
    const bytes = Buffer.from(src.slice(comma + 1), "base64");
    if (bytes.byteLength < 32 || bytes.byteLength > MAX_IMAGE_BYTES) return null;
    return bytes;
  }

  if (src.startsWith("/") && !src.startsWith("//")) {
    const publicRoot = path.resolve(process.cwd(), "public");
    const filePath = path.resolve(publicRoot, src.replace(/^\/+/, ""));
    if (!filePath.startsWith(publicRoot + path.sep)) {
      return null;
    }
    try {
      const bytes = await readFile(filePath);
      if (bytes.byteLength < 32 || bytes.byteLength > MAX_IMAGE_BYTES) return null;
      return bytes;
    } catch {
      return null;
    }
  }

  const url = src.startsWith("//") ? `https:${src}` : src;
  if (!/^https?:\/\//i.test(url)) return null;

  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) return null;
  const mime = res.headers.get("content-type") || "";
  if (mime && !mime.startsWith("image/")) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.byteLength < 32 || bytes.byteLength > MAX_IMAGE_BYTES) return null;
  return bytes;
}

/** Satori が扱える PNG data URL に変換する（WebP / 大きすぎる画像向け） */
export async function toOgImageSrc(src: string): Promise<string | null> {
  const raw = src.trim();
  if (!raw) return null;
  try {
    const input = await readImageBytes(raw);
    if (!input) return null;
    const png = await sharp(input)
      .rotate()
      .resize(OG_PANEL_WIDTH, OG_PANEL_HEIGHT, {
        fit: "cover",
        position: "centre",
      })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}
