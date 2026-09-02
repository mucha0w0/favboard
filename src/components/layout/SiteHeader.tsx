import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  actions?: ReactNode;
  className?: string;
  maxWidth?: "narrow" | "wide";
}

export function SiteHeader({
  actions,
  className,
  maxWidth = "narrow",
}: SiteHeaderProps) {
  const widthClass =
    maxWidth === "wide" ? "max-w-[960px]" : "max-w-3xl";

  return (
    <header className={cn("site-header sticky top-0 z-30", className)}>
      <div
        className={cn(
          "mx-auto flex items-center justify-between px-5 py-4 sm:px-6",
          widthClass,
        )}
      >
        <Link
          href="/"
          className="text-sm font-medium tracking-tight text-stone-900 transition-opacity hover:opacity-70"
        >
          Visual Wishlist
        </Link>
        {actions && (
          <div className="flex items-center gap-1">{actions}</div>
        )}
      </div>
    </header>
  );
}
