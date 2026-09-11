"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getClipboardImageFile, imageFileToDataUrl } from "@/lib/image-input";
import type { ImageCrop } from "@/lib/types";
import { ImageIcon, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductImageAspectProbe } from "./blocks/product/ProductImageAspectProbe";
import { ProductImageCropEditor } from "./ProductImageCropEditor";

interface ProductImageInputProps {
  value: string;
  onChange: (url: string) => void;
  crop?: ImageCrop;
  onCropChange?: (crop: ImageCrop | undefined) => void;
  cellSpan?: { colSpan: number; rowSpan: number };
  open?: boolean;
}

function normalizePreviewUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

export function ProductImageInput({
  value,
  onChange,
  crop,
  onCropChange,
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
    try {
      const dataUrl = await imageFileToDataUrl(file);
      onCropChange?.(undefined);
      onChange(dataUrl);
      setUrlDraft("");
      setPreviewError(false);
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
    onCropChange?.(undefined);
    onChange(url);
    setUrlDraft("");
  }

  function handleUrlKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddUrl();
    }
  }

  function handleClear() {
    onChange("");
    onCropChange?.(undefined);
    setPreviewError(false);
    setError("");
  }

  return (
    <div className="space-y-2">
      {cellSpan && open && (
        <ProductImageAspectProbe
          key={probeKey}
          cellSpan={cellSpan}
          onAspectChange={handleAspectChange}
        />
      )}
      <Label>画像</Label>

      <div
        tabIndex={0}
        onPaste={handlePaste}
        className="relative overflow-hidden rounded-lg border border-dashed border-stone-200 bg-stone-50/80 outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3] w-full">
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
                デバイスから選ぶか、URLを入力して追加、
                <br />
                または Ctrl+V / ⌘V で貼り付け
              </p>
            </div>
          )}
        </div>

        {showPreview && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 h-7 w-7 text-stone-400"
            onClick={handleClear}
            aria-label="画像を削除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {showPreview && (
        <p className="text-xs text-stone-400">
          枠をドラッグして表示位置を調整できます
        </p>
      )}

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
