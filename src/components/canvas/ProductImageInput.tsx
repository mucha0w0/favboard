"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClipboardImageFile, imageFileToDataUrl } from "@/lib/image-input";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

interface ProductImageInputProps {
  value: string;
  onChange: (url: string) => void;
}

function normalizePreviewUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

export function ProductImageInput({ value, onChange }: ProductImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [error, setError] = useState("");

  const showPreview = Boolean(value.trim() && !previewError);

  async function applyImageFile(file: File | Blob | null) {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const dataUrl = await imageFileToDataUrl(file);
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
    setPreviewError(false);
    setError("");
  }

  return (
    <div className="space-y-2">
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
          ) : showPreview ? (
            <Image
              src={normalizePreviewUrl(value.trim())}
              alt="商品画像プレビュー"
              fill
              className="object-contain"
              unoptimized
              onError={() => setPreviewError(true)}
            />
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
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7 bg-white/90 shadow-sm"
            onClick={handleClear}
            aria-label="画像を削除"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
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
          className="shrink-0"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          デバイスから選ぶ
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="image-url" className="text-xs text-stone-500">
          URLで追加
        </Label>
        <div className="flex gap-2">
          <Input
            id="image-url"
            value={urlDraft}
            onChange={(e) => {
              setUrlDraft(e.target.value);
              setError("");
            }}
            onPaste={handlePaste}
            onKeyDown={handleUrlKeyDown}
            placeholder="https://..."
          />
          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            disabled={loading || !urlDraft.trim()}
            onClick={handleAddUrl}
          >
            追加
          </Button>
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
