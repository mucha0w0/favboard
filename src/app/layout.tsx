import { SiteLegalFooter } from "@/components/layout/SiteLegalFooter";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Favboard（ファブボード）— 好きを集めるビジュアルボード",
  description:
    "見出し・テキスト・Bentoグリッドで、好きなものを集めて公開するビジュアルボード。あなたの好きを、そのまま見せる場所。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col font-sans">
        {children}
        <SiteLegalFooter />
      </body>
    </html>
  );
}
