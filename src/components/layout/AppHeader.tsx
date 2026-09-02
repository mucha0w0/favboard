import Link from "next/link";
import { type MouseEvent, type ReactNode } from "react";

interface AppHeaderProps {
  backHref?: string;
  backLabel?: string;
  onBackClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  title?: ReactNode;
  actions?: ReactNode;
  maxWidth?: "2xl" | "4xl";
}

export function AppHeader({
  backHref,
  backLabel = "戻る",
  onBackClick,
  title,
  actions,
  maxWidth = "2xl",
}: AppHeaderProps) {
  const widthClass = maxWidth === "4xl" ? "max-w-4xl" : "max-w-2xl";

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-md">
      <div
        className={`mx-auto flex items-center gap-3 px-4 py-3 ${widthClass}`}
      >
        {backHref && (
          <Link
            href={backHref}
            onClick={onBackClick}
            className="shrink-0 text-sm text-stone-500 transition-colors hover:text-stone-900"
          >
            {backLabel}
          </Link>
        )}
        {title && <div className="min-w-0 flex-1">{title}</div>}
        {actions && (
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
