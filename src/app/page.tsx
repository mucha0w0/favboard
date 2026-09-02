import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <span className="text-sm font-medium tracking-tight text-stone-900">
            Visual Wishlist
          </span>
          <div className="flex items-center gap-1">
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

      <main className="mx-auto max-w-3xl px-4">
        <section className="py-20 sm:py-28">
          <h1 className="text-3xl font-semibold leading-[1.25] tracking-tight text-stone-900 sm:text-[2.5rem]">
            欲しいものを、
            <br />
            ひとつのページに。
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-stone-500">
            見出し・商品・テキストを縦に綴って、あなただけのウィッシュリストを共有。代払い機能はありません。
          </p>
          <div className="mt-8">
            <Link href="/login">
              <Button>無料ではじめる</Button>
            </Link>
          </div>
        </section>

        <section className="border-t border-stone-200 py-16">
          <dl className="space-y-10">
            <Feature
              number="01"
              title="縦に綴る"
              description="見出し・商品・区切り線を、文章の流れのまま追加。枠のない一体感のあるレイアウト。"
            />
            <Feature
              number="02"
              title="URLから自動入力"
              description="商品URLを貼るだけでタイトルと画像を取得。手動での編集も自由にできます。"
            />
            <Feature
              number="03"
              title="公開してシェア"
              description="固有URLで公開。SNSシェア用のOGPも自動設定されます。"
            />
          </dl>
        </section>

        <footer className="border-t border-stone-200 py-10">
          <p className="text-xs text-stone-400">
            公式ページへのリンクのみ。ねだり・代払い要素はありません。
          </p>
        </footer>
      </main>
    </div>
  );
}

function Feature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-6">
      <dt className="shrink-0 text-xs tabular-nums text-stone-300">{number}</dt>
      <dd>
        <h3 className="font-medium text-stone-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
          {description}
        </p>
      </dd>
    </div>
  );
}
