import { SiteHeader } from "@/components/layout/SiteHeader";
import { buttonVariants } from "@/components/ui/button";
import { getOrCreateProfile } from "@/lib/profile-service";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function NotFound() {
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

  return (
    <div className="flex flex-1 flex-col bg-stone-50">
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
        <section className="mx-auto max-w-3xl px-8 pb-24 pt-24 sm:px-12 sm:pb-32 sm:pt-36">
          <h1 className="text-balance text-4xl font-semibold leading-[1.15] tracking-tight text-stone-900 sm:text-5xl">
            404
          </h1>
          <p className="mt-3 text-sm tracking-wide text-stone-400">
            Not Found
          </p>
          <p className="ja-heading mt-10 text-balance text-xl font-medium text-stone-800 sm:text-2xl">
            お探しのページは見つかりませんでした。
          </p>
          <p className="ja-copy mt-8 max-w-xl text-[15px] text-stone-500">
            アドレスが間違っているか、公開が終了しているかもしれません。
          </p>
          <Link
            href="/"
            className={buttonVariants({
              size: "lg",
              className: "mt-14",
            })}
          >
            トップへ戻る
          </Link>
        </section>
      </main>
    </div>
  );
}
