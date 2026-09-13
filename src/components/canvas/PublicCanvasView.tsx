"use client";

import { BlockStream } from "@/components/canvas/BlockStream";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { canvasTweetIntentUrl } from "@/lib/canvas-utils";
import { profileInitials } from "@/lib/profile";
import { type Canvas, type Profile } from "@/lib/types";
import { Share2 } from "lucide-react";
import Link from "next/link";

interface PublicCanvasViewProps {
  canvas: Canvas;
  creator?: Profile | null;
  shareUrl: string;
  isDraftPreview?: boolean;
}

export function PublicCanvasView({
  canvas,
  creator = null,
  shareUrl,
  isDraftPreview = false,
}: PublicCanvasViewProps) {
  function handleShare() {
    window.open(
      canvasTweetIntentUrl(canvas.title, shareUrl),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <SiteHeader
        actions={
          isDraftPreview ? (
            <span className="text-xs text-stone-400">下書きプレビュー</span>
          ) : (
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              はじめる
            </Link>
          )
        }
      />

      <main className="px-5 pb-40 pt-10 sm:px-6 sm:pb-56 sm:pt-16">
        <article className="content-column animate-fade-in">
          <header className="mb-12 sm:mb-14">
            {isDraftPreview && (
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                Draft Preview
              </p>
            )}
            <div className="flex items-start gap-3">
              <h1 className="ja-heading min-w-0 text-[1.75rem] font-bold leading-[1.35] text-stone-900 sm:text-[2.25rem]">
                {canvas.title}
              </h1>
              {!isDraftPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="mt-1 shrink-0 text-stone-600"
                >
                  <Share2 className="h-4 w-4" />
                  シェア
                </Button>
              )}
            </div>
            {creator && <CreatorByline profile={creator} />}
          </header>

          {canvas.blocks.length === 0 ? (
            <p className="ja-copy py-16 text-center text-[15px] text-stone-400">
              コンテンツはまだありません
            </p>
          ) : (
            <div className="document-body">
              <BlockStream blocks={canvas.blocks} />
            </div>
          )}
        </article>
      </main>
    </div>
  );
}

function CreatorByline({ profile }: { profile: Profile }) {
  const displayName = profile.display_name.trim() || profile.username;
  const initials = profileInitials(profile.display_name, profile.username);

  return (
    <div className="mt-5 flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-stone-200 text-xs font-medium text-stone-600 ring-1 ring-stone-200/80">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-stone-800">
          {displayName}
        </p>
        <p className="truncate text-xs text-stone-400">@{profile.username}</p>
      </div>
    </div>
  );
}
