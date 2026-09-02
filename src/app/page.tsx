import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <SiteHeader
        actions={
          <>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                ログイン
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">はじめる</Button>
            </Link>
          </>
        }
      />

      <main>
        <section className="mx-auto max-w-3xl px-5 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
          <p className="animate-fade-up text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
            Visual Portfolio
          </p>
          <h1 className="animate-fade-up stagger-1 mt-5 text-balance text-3xl font-semibold leading-[1.25] tracking-tight text-stone-900 sm:text-[2.75rem]">
            物欲の方向性を、
            <br />
            ひとつのページに。
          </h1>
          <p className="animate-fade-up stagger-2 mt-6 max-w-md text-[15px] leading-relaxed text-stone-500">
            欲しいもの・こだわり・美学を、文章のように綴って共有。
            クリエイターのポートフォリオのように、あなたの「好き」を世界に届けます。
          </p>
          <div className="animate-fade-up stagger-3 mt-10 flex flex-wrap items-center gap-3">
            <Link href="/login">
              <Button size="lg">無料ではじめる</Button>
            </Link>
            <span className="text-xs text-stone-400">
              代払い機能なし · 純粋な共有
            </span>
          </div>
        </section>

        <section className="animate-fade-up stagger-4 mx-auto max-w-3xl px-5 pb-24 sm:px-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-stone-400">
            Preview
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
            Spring Essentials
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-500">
            春に向けて揃えたい、ミニマルで長く使えるアイテムたち。
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-square bg-stone-100" />
                <div className="space-y-1">
                  <div className="h-2 w-8 bg-stone-200" />
                  <div className="h-2.5 w-full bg-stone-200" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-20 sm:px-6 sm:py-28">
          <h2 className="text-lg font-semibold tracking-tight text-stone-900">
            シンプルに、美しく
          </h2>
          <dl className="mt-12 grid gap-12 sm:grid-cols-3 sm:gap-8">
            <Feature
              number="01"
              title="縦に綴る"
              description="見出し・商品・テキストを、エディトリアルな流れで配置。枠のない一体感のあるレイアウト。"
            />
            <Feature
              number="02"
              title="URLから自動入力"
              description="商品URLを貼るだけでタイトルと画像を取得。手動での編集も自由に。"
            />
            <Feature
              number="03"
              title="公開してシェア"
              description="固有URLで公開。SNSシェア用のOGPも自動設定。"
            />
          </dl>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-6 sm:py-28">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            あなたの物欲を、
            <br className="sm:hidden" />
            形にしよう。
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm text-stone-500">
            アカウント不要のローカルモードでも試せます。
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button size="lg">はじめる</Button>
          </Link>
        </section>

        <footer className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
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
    <div>
      <dt className="text-[11px] tabular-nums tracking-widest text-stone-300">
        {number}
      </dt>
      <dd className="mt-3">
        <h3 className="font-medium text-stone-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          {description}
        </p>
      </dd>
    </div>
  );
}
