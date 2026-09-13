import type { Canvas } from "@/lib/types";
import { collectProductImages } from "@/lib/canvas-utils";
import {
  loadOgFonts,
  OG_SIZE,
  toOgImageSrc,
  truncateOgTitle,
} from "@/lib/og";
import { ImageResponse } from "next/og";

export async function renderCanvasOgImage(canvas: Canvas | null) {
  const title = truncateOgTitle(canvas?.title || "Favboard");
  const rawImage = collectProductImages(canvas?.blocks ?? [], 1)[0];
  const imageSrc = rawImage ? await toOgImageSrc(rawImage) : null;
  const fonts = await loadOgFonts(title);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#fafaf9",
          color: "#1c1917",
          fontFamily: fonts.length ? "Noto Sans JP" : "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: imageSrc ? "58%" : "100%",
            height: "100%",
            padding: imageSrc ? "64px 56px" : "72px 80px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.04em",
              }}
            >
              Favboard
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 8,
                fontSize: 18,
                fontWeight: 400,
                color: "#a8a29e",
                letterSpacing: "0.16em",
              }}
            >
              ファブボード
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 20 ? 48 : 60,
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: "-0.04em",
            }}
          >
            {title}
          </div>
        </div>
        {imageSrc ? (
          <div
            style={{
              display: "flex",
              width: "42%",
              height: "100%",
              overflow: "hidden",
              background: "#e7e5e4",
            }}
          >
            <img
              src={imageSrc}
              width={504}
              height={630}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        ) : null}
      </div>
    ),
    {
      ...OG_SIZE,
      fonts,
    },
  );
}
