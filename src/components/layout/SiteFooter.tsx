import Link from "next/link";
import { cn } from "@/lib/utils";

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={cn("site-footer mt-auto bg-white/85 backdrop-blur-md", className)}>
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-8 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-12 sm:py-12">
        <div>
          <Link
            href="/"
            className="text-sm font-bold tracking-tight text-stone-900 transition-opacity hover:opacity-70"
          >
            Favboard
          </Link>
          <p className="mt-1 text-xs tracking-wide text-stone-400">
            ファブボード
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-stone-500">
            好きを、ひとつのボードに。
          </p>
        </div>
        <div className="space-y-2 sm:text-right">
          <p className="text-xs leading-relaxed text-stone-400">
            公式ページへのリンクのみ。
            <br />
            ねだり・代払い要素はありません。
          </p>
          <p className="text-[11px] text-stone-400">
            © {new Date().getFullYear()} Favboard
          </p>
        </div>
      </div>
    </footer>
  );
}
