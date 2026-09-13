"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  canvasPublicPath,
  canvasShareUrl,
  canvasTweetIntentUrl,
} from "@/lib/canvas-utils";
import { cn } from "@/lib/utils";
import { Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface PublishSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  title: string;
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
}: PublishSuccessDialogProps) {
  const publicPath = canvasPublicPath(slug);
  const [shareUrl, setShareUrl] = useState(publicPath);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setShareUrl(canvasShareUrl(slug));
    setCopied(false);
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, [open, slug]);

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
      title="リストを公開しました！"
      titleClassName="text-lg font-semibold tracking-tight"
      className="max-w-md"
    >
      <p className="text-pretty text-sm leading-relaxed text-stone-500">
        誰でもこのURLから見られるようになりました。
      </p>

      <div className="mt-5 flex items-center gap-2 border-b border-stone-200 pb-2">
        <Link
          href={publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-sm text-stone-700 underline-offset-4 hover:text-stone-900 hover:underline"
        >
          {shareUrl}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 shrink-0 px-2 text-xs text-stone-500"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              コピー済み
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              コピー
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
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
