import Link from "next/link";
import { type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  actions?: ReactNode;
  center?: ReactNode;
  className?: string;
  onBrandClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export function SiteHeader({
  actions,
  center,
  className,
  onBrandClick,
}: SiteHeaderProps) {
  return (
    <header className={cn("site-header sticky top-0 z-30", className)}>
      <div
        className={cn(
          "grid items-center gap-3 px-5 py-4 sm:px-6",
          center ? "grid-cols-[1fr_auto_1fr]" : "grid-cols-[1fr_auto]",
        )}
      >
        <Link
          href="/"
          onClick={onBrandClick}
          className="justify-self-start text-sm font-bold tracking-tight text-stone-900 transition-opacity hover:opacity-70"
        >
          Favboard
        </Link>
        {center && <div className="justify-self-center">{center}</div>}
        <div className="flex items-center justify-self-end gap-1">
          {actions}
        </div>
      </div>
    </header>
  );
}
