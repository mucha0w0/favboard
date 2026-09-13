import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { getOrCreateProfile } from "@/lib/profile-service";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let userId: string | null = null;
  let displayName = "ユーザー";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    if (user) {
      try {
        const profile = await getOrCreateProfile(user);
        displayName = profile.display_name.trim() || profile.username;
      } catch {
        displayName = "ユーザー";
      }
    }
  } catch {
    userId = null;
  }
  const startHref = userId ? "/dashboard" : "/login";

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <SiteHeader
        actions={
          userId ? (
            <Link
              href="/dashboard"
              className="text-sm text-stone-900 transition-opacity hover:opacity-70"
            >
              {displayName}のダッシュボード
            </Link>
          ) : (
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              はじめる
            </Link>
          )
        }
      />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-8 pb-32 pt-24 sm:px-12 sm:pb-44 sm:pt-36">
          <h1 className="text-balance text-4xl font-semibold leading-[1.15] tracking-tight text-stone-900 sm:text-5xl">
            Favboard
          </h1>
          <p className="mt-3 text-sm tracking-wide text-stone-400">
            ファブボード
          </p>
          <p className="mt-10 text-balance text-xl font-medium leading-snug tracking-tight text-stone-800 sm:text-2xl">
            好きを、ひとつのボードに。
          </p>
          <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-stone-500">
            見出し・テキスト・区切り線と、商品を並べる Bento グリッドで、好きなものを集めて公開。
          </p>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-500">
            あなたの好きを、そのまま見せる場所です。
          </p>
          <div className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-3">
            <Link href={startHref}>
              <Button size="lg">
                {userId ? "マイリストを開く" : "無料ではじめる"}
              </Button>
            </Link>
            <span className="text-xs tracking-wide text-stone-400">
              すぐに公開できます
            </span>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-8 py-28 sm:px-12 sm:py-40">
          <h2 className="text-lg font-semibold tracking-tight text-stone-900">
            シンプルに、美しく
          </h2>
          <dl className="mt-16 grid gap-16 sm:grid-cols-3 sm:gap-12">
            <Feature
              number="01"
              title="縦に組む"
              description="見出し・テキスト・区切り線・Bento を上から順に配置。ドキュメントのようにボードを組み立てます。"
            />
            <Feature
              number="02"
              title="Bento で見せる"
              description="グリッドに商品とテキストを置き、大きさを変えられます。画像・ブランド・価格・公式サイトを残せます。"
            />
            <Feature
              number="03"
              title="公開してシェア"
              description="固有URLで公開。Xへのシェアと、SNS用のOGPも自動で設定されます。"
            />
          </dl>
        </section>

        <section className="mx-auto max-w-3xl px-8 py-28 text-center sm:px-12 sm:py-40">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            Favboard ではじめよう
          </h2>
          <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-stone-500">
            Xアカウントでログインすると、リストの作成と公開ができます。
          </p>
          <Link href={startHref} className="mt-12 inline-block">
            <Button size="lg">
              {userId ? "マイリストを開く" : "はじめる"}
            </Button>
          </Link>
        </section>
      </main>

      <SiteFooter />
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
      <dd className="mt-4">
        <h3 className="font-medium text-stone-900">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          {description}
        </p>
      </dd>
    </div>
  );
}
