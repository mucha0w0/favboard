import { Button } from "@/components/ui/button";
import { Layers, Link2, Share2 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold tracking-tight">
            Visual Wishlist
          </span>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                ログイン
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">はじめる</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 py-24 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-400">
            Visual Wishlist Canvas
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            物欲を、
            <br />
            ビジュアルポートフォリオに。
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-500">
            代払い機能なし。欲しいもの・こだわりを、note のように縦に綴って共有。
          </p>
          <div className="mt-10 flex justify-center gap-3">
            <Link href="/login">
              <Button size="lg">無料ではじめる</Button>
            </Link>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white py-20">
          <div className="mx-auto grid max-w-5xl gap-12 px-4 sm:grid-cols-3">
            <Feature
              icon={Layers}
              title="縦に綴る"
              description="見出し・商品・区切り線を、文章のように自然な流れで追加。枠線のない一体感のあるレイアウト。"
            />
            <Feature
              icon={Link2}
              title="URL自動補完"
              description="Amazon・楽天などのURLを貼るだけでOGPからタイトル・画像を自動取得。手動編集も自由。"
            />
            <Feature
              icon={Share2}
              title="公開＆シェア"
              description="固有URLで公開。SNSシェア用OGPも自動設定。決済・代払い機能は一切なし。"
            />
          </div>
        </section>

        <section className="py-16 text-center">
          <p className="text-sm text-zinc-400">
            公式ページへのリンクのみ。ねだり・代払い要素は排除。
          </p>
        </section>
      </main>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Layers;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
        <Icon className="h-5 w-5 text-zinc-600" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}
