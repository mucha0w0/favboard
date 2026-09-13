import Link from "next/link";

const linkClassName =
  "transition-colors hover:text-stone-700";

export function SiteLegalFooter() {
  return (
    <footer className="mt-auto">
      <nav
        aria-label="法務"
        className="mx-auto flex w-full max-w-[960px] flex-wrap items-center justify-center gap-x-5 gap-y-2 px-8 py-6 text-[11px] tracking-wide text-stone-400 sm:px-12"
      >
        <Link href="/privacy" className={linkClassName}>
          プライバシーポリシー
        </Link>
        <Link href="/terms" className={linkClassName}>
          利用規約
        </Link>
      </nav>
    </footer>
  );
}
