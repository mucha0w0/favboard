"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  canvasOgImagePath,
  canvasPublicPath,
  canvasShareUrl,
  canvasTweetIntentUrl,
} from "@/lib/canvas-utils";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface PublishSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  title: string;
  updatedAt?: string;
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function PublishSuccessDialog({
  open,
  onOpenChange,
  slug,
  title,
  updatedAt,
}: PublishSuccessDialogProps) {
  const publicPath = canvasPublicPath(slug);
  const ogSrc = canvasOgImagePath(slug, updatedAt);
  const [shareUrl, setShareUrl] = useState(publicPath);
  const [copied, setCopied] = useState(false);
  const [previewState, setPreviewState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setShareUrl(canvasShareUrl(slug));
    setCopied(false);
    setPreviewState("loading");
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, [open, slug, updatedAt]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleShareX() {
    window.open(
      canvasTweetIntentUrl(title, shareUrl),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="リストを公開しました"
      titleClassName="text-lg font-semibold tracking-tight"
      className="max-w-xl"
      headerClassName="items-center px-7 pt-6 pb-0 sm:px-8 sm:pt-7"
      contentClassName="px-7 pb-7 sm:px-8 sm:pb-8"
    >
      {previewState !== "error" && (
        <Link
          href={publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="relative mt-4 block overflow-hidden bg-stone-100"
        >
          {previewState === "loading" && (
            <div
              className="absolute inset-0 animate-pulse bg-stone-100"
              aria-hidden
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={ogSrc}
            src={ogSrc}
            alt={`${title} のシェア画像`}
            width={1200}
            height={630}
            decoding="async"
            onLoad={() => setPreviewState("ready")}
            onError={() => setPreviewState("error")}
            className={cn(
              "aspect-1200/630 w-full object-cover transition-opacity duration-200",
              previewState === "ready" ? "opacity-100" : "opacity-0",
            )}
          />
        </Link>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Link
          href={publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-sm text-stone-500 hover:text-stone-800"
        >
          {shareUrl}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-auto shrink-0 px-0 text-xs font-medium text-stone-400 hover:bg-transparent hover:text-stone-700"
        >
          {copied ? "コピー済み" : "コピー"}
        </Button>
      </div>

      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
        <Link
          href={publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants(), "flex-1")}
        >
          <ExternalLink className="h-4 w-4" />
          公開ページを見る
        </Link>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleShareX}
        >
          <XLogo className="h-3.5 w-3.5" />
          Xでシェア
        </Button>
      </div>
    </Dialog>
  );
}
