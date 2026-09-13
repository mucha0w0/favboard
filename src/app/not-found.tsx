import { SiteHeader } from "@/components/layout/SiteHeader";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col bg-stone-50">
      <SiteHeader
        actions={
          <Link href="/" className={buttonVariants({ size: "sm" })}>
            トップへ
          </Link>
        }
      />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-8 pb-24 pt-24 sm:px-12 sm:pb-32 sm:pt-36">
          <h1 className="animate-fade-up text-balance text-4xl font-semibold leading-[1.15] tracking-tight text-stone-900 sm:text-5xl">
            404
          </h1>
          <p className="animate-fade-up stagger-1 mt-3 text-sm tracking-wide text-stone-400">
            ページが見つかりません
          </p>
          <p className="ja-heading animate-fade-up stagger-2 mt-10 text-balance text-xl font-medium text-stone-800 sm:text-2xl">
            この先には、ボードがありません。
          </p>
          <p className="ja-copy animate-fade-up stagger-3 mt-8 max-w-xl text-[15px] text-stone-500">
            アドレスが違うか、公開が終わったボードかもしれません。
          </p>
          <p className="ja-copy animate-fade-up stagger-3 mt-4 max-w-xl text-[15px] text-stone-500">
            Favboard のトップから、好きを集める場所へ戻れます。
          </p>
          <Link
            href="/"
            className={buttonVariants({
              size: "lg",
              className: "animate-fade-up stagger-4 mt-14",
            })}
          >
            トップへ戻る
          </Link>
        </section>
      </main>
    </div>
  );
}
