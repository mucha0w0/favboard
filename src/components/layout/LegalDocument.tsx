import { SiteHeader } from "@/components/layout/SiteHeader";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal";
import Link from "next/link";
import { type ReactNode } from "react";

interface LegalDocumentProps {
  title: string;
  current: "privacy" | "terms";
  children: ReactNode;
}

const legalNavLinkClass =
  "transition-colors hover:text-stone-700";

export function LegalDocument({
  title,
  current,
  children,
}: LegalDocumentProps) {
  return (
    <div className="flex flex-1 flex-col bg-stone-50">
      <SiteHeader
        actions={
          <nav className="flex items-center gap-3 text-[11px] tracking-wide text-stone-400 sm:gap-4">
            <Link
              href="/privacy"
              className={legalNavLinkClass}
              aria-current={current === "privacy" ? "page" : undefined}
            >
              <span className={current === "privacy" ? "text-stone-700" : undefined}>
                <span className="sm:hidden">プライバシー</span>
                <span className="hidden sm:inline">プライバシーポリシー</span>
              </span>
            </Link>
            <Link
              href="/terms"
              className={legalNavLinkClass}
              aria-current={current === "terms" ? "page" : undefined}
            >
              <span className={current === "terms" ? "text-stone-700" : undefined}>
                利用規約
              </span>
            </Link>
          </nav>
        }
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-8 pb-20 pt-16 sm:px-12 sm:pb-28 sm:pt-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
          Favboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-xs text-stone-400">
          制定日: {LEGAL_EFFECTIVE_DATE}（同日施行）
        </p>
        <article className="mt-12 space-y-12 text-[15px] leading-relaxed text-stone-600">
          {children}
        </article>
      </main>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24">
      <h2
        id={id}
        className="text-base font-semibold tracking-tight text-stone-900"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-stone-300">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
