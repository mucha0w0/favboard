"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getClipboardImageFile,
  imageFileToProductBlob,
} from "@/lib/image-input";
import {
  deleteProductStorageUrls,
  isProductStorageUrl,
  uploadProductImageBlob,
} from "@/lib/product-images";
import { createClient } from "@/lib/supabase/client";
import type { Block, ImageCrop } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImageIcon, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductImageAspectProbe } from "./blocks/product/ProductImageAspectProbe";
import { ProductImageCropEditor } from "./ProductImageCropEditor";

interface ProductImageInputProps {
  value: string;
  onChange: (url: string) => void;
  crop?: ImageCrop;
  onCropChange?: (crop: ImageCrop | undefined) => void;
  previewBlock?: Block;
  cellSpan?: { colSpan: number; rowSpan: number };
  open?: boolean;
}

function normalizePreviewUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

async function removeStoredImage(url: string) {
  if (!isProductStorageUrl(url)) return;
  const supabase = createClient();
  await deleteProductStorageUrls(supabase, [url]);
}

export function ProductImageInput({
  value,
  onChange,
  crop,
  onCropChange,
  previewBlock,
  cellSpan,
  open = true,
}: ProductImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [error, setError] = useState("");
  const [displayAspect, setDisplayAspect] = useState<number | null>(
    cellSpan ? null : 1,
  );
  const [probeKey, setProbeKey] = useState(0);

  const handleAspectChange = useCallback((aspect: number) => {
    setDisplayAspect(aspect);
  }, []);

  useEffect(() => {
    if (!open) return;
    setDisplayAspect(cellSpan ? null : 1);
    setProbeKey((key) => key + 1);
  }, [open, cellSpan?.colSpan, cellSpan?.rowSpan]);

  const showPreview = Boolean(value.trim() && !previewError);

  const handleCropChange = useCallback(
    (next: ImageCrop) => {
      onCropChange?.(next);
    },
    [onCropChange],
  );

  async function applyImageFile(file: File | Blob | null) {
    if (!file) return;
    setLoading(true);
    setError("");
    const previous = value.trim();
    try {
      const image = await imageFileToProductBlob(file);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("ログインが必要です");
      }
      const publicUrl = await uploadProductImageBlob(supabase, user.id, {
        body: image.blob,
        contentType: image.contentType,
        extension: image.extension,
      });
      onCropChange?.(undefined);
      onChange(publicUrl);
      setUrlDraft("");
      setPreviewError(false);
      if (previous && previous !== publicUrl) {
        void removeStoredImage(previous);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "画像の読み込みに失敗しました",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    void applyImageFile(file ?? null);
    e.target.value = "";
  }

  function handlePaste(e: React.ClipboardEvent) {
    const imageFile = getClipboardImageFile(e.clipboardData);
    if (!imageFile) return;
    e.preventDefault();
    void applyImageFile(imageFile);
  }

  function handleAddUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    setError("");
    setPreviewError(false);
    const previous = value.trim();
    onCropChange?.(undefined);
    onChange(url);
    setUrlDraft("");
    if (previous && previous !== url) {
      void removeStoredImage(previous);
    }
  }

  function handleUrlKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddUrl();
    }
  }

  function handleClear() {
    const previous = value.trim();
    onChange("");
    onCropChange?.(undefined);
    setPreviewError(false);
    setError("");
    if (previous) void removeStoredImage(previous);
  }

  return (
    <div className="space-y-2">
      {cellSpan && previewBlock && open && (
        <ProductImageAspectProbe
          key={probeKey}
          block={previewBlock}
          cellSpan={cellSpan}
          onAspectChange={handleAspectChange}
        />
      )}
      <Label>画像</Label>

      <div
        tabIndex={0}
        onPaste={handlePaste}
        className={cn(
          "relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2",
          showPreview ? "overflow-visible" : "overflow-hidden",
        )}
      >
        <div className="relative aspect-4/3 w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-stone-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : showPreview && displayAspect !== null ? (
            <ProductImageCropEditor
              imageUrl={normalizePreviewUrl(value.trim())}
              crop={crop}
              cropAspect={displayAspect}
              onCropChange={handleCropChange}
              onError={() => setPreviewError(true)}
            />
          ) : showPreview ? (
            <div className="flex h-full items-center justify-center text-stone-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-stone-400">
              <ImageIcon className="h-8 w-8" />
              <p className="text-xs leading-relaxed">
                デバイスから選ぶ
                <br />
                URLを入力して追加
                <br />
                Ctrl+V / ⌘V で貼り付け
              </p>
            </div>
          )}
        </div>

        {showPreview && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 z-30 h-7 w-7 text-stone-400"
            onClick={handleClear}
            aria-label="画像を削除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-center sm:w-auto sm:justify-start"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          デバイスから選ぶ
        </Button>

        <div className="flex h-8 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 text-stone-700 transition-colors focus-within:border-stone-300">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-stone-500" aria-hidden />
          <input
            id="image-url"
            value={urlDraft}
            onChange={(e) => {
              setUrlDraft(e.target.value);
              setError("");
            }}
            onPaste={handlePaste}
            onKeyDown={handleUrlKeyDown}
            placeholder="URLで追加"
            disabled={loading}
            className="min-w-0 flex-1 bg-transparent text-xs text-stone-700 outline-none placeholder:text-stone-400 disabled:opacity-40"
          />
          <button
            type="button"
            disabled={loading || !urlDraft.trim()}
            onClick={handleAddUrl}
            className="shrink-0 text-xs font-medium text-stone-700 transition-opacity hover:text-stone-900 disabled:pointer-events-none disabled:opacity-40"
          >
            追加
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {value.trim() && previewError && (
        <p className="text-xs text-amber-600">
          プレビューを表示できません。URLを確認してください。
        </p>
      )}
    </div>
  );
}
