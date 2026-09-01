"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PRODUCT_SIZES,
  type Block,
  type BlockData,
  type OgpData,
  type ProductSize,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface ProductFormDialogProps {
  block: Block | null;
  open: boolean;
  isNew?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (blockId: string, data: BlockData) => void;
  onCancel?: () => void;
}

export function ProductFormDialog({
  block,
  open,
  isNew = false,
  onOpenChange,
  onSave,
  onCancel,
}: ProductFormDialogProps) {
  function handleClose() {
    onCancel?.();
    onOpenChange(false);
  }

  const typeLabel =
    block?.type === "heading"
      ? "見出し"
      : block?.type === "text"
        ? "テキスト"
        : block?.type === "product"
          ? "商品"
          : "ブロック";

  const dialogTitle = isNew ? `${typeLabel}を追加` : `${typeLabel}を編集`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}
      title={dialogTitle}
    >
      {block && (
        <ProductFormFields
          key={block.id}
          block={block}
          onSave={onSave}
          onOpenChange={onOpenChange}
          onCancel={onCancel}
        />
      )}
    </Dialog>
  );
}

function ProductFormFields({
  block,
  onSave,
  onOpenChange,
  onCancel,
}: {
  block: Block;
  onSave: (blockId: string, data: BlockData) => void;
  onOpenChange: (open: boolean) => void;
  onCancel?: () => void;
}) {
  const [productUrl, setProductUrl] = useState(block.data.product_url || "");
  const [title, setTitle] = useState(block.data.title || "");
  const [brand, setBrand] = useState(block.data.brand || "");
  const [price, setPrice] = useState(block.data.price || "");
  const [imageUrl, setImageUrl] = useState(block.data.image_url || "");
  const [comment, setComment] = useState(block.data.comment || "");
  const [headingText, setHeadingText] = useState(block.data.text || "");
  const [bodyText, setBodyText] = useState(block.data.body || "");
  const [productSize, setProductSize] = useState<ProductSize>(
    block.data.product_size || "standard",
  );
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const isHeading = block.type === "heading";
  const isText = block.type === "text";

  function handleClose() {
    onCancel?.();
    onOpenChange(false);
  }

  async function fetchOgp() {
    const url = productUrl.trim();
    if (!url) return;
    setFetching(true);
    setFetchError("");
    try {
      const res = await fetch("/api/ogp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        setFetchError("OGPの取得に失敗しました。手動で入力してください。");
        return;
      }
      const ogp: OgpData = await res.json();
      if (ogp.title) setTitle(ogp.title);
      if (ogp.siteName) setBrand(ogp.siteName);
      if (ogp.image) setImageUrl(ogp.image);
    } catch {
      setFetchError("OGPの取得に失敗しました。手動で入力してください。");
    } finally {
      setFetching(false);
    }
  }

  function handleApply() {
    if (isHeading) {
      if (!headingText.trim()) return;
      onSave(block.id, { text: headingText.trim() });
    } else if (isText) {
      onSave(block.id, { body: bodyText });
    } else {
      onSave(block.id, {
        title: title.trim() || "Untitled Product",
        brand: brand.trim(),
        price: price.trim(),
        image_url: imageUrl.trim(),
        product_url: productUrl.trim(),
        comment: comment.trim(),
        product_size: productSize,
      });
    }
    onOpenChange(false);
  }

  return (
    <>
      {isHeading ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heading-text">見出し</Label>
            <Input
              id="heading-text"
              value={headingText}
              onChange={(e) => setHeadingText(e.target.value)}
              placeholder="カテゴリ名やセクションタイトル"
              autoFocus
            />
          </div>
        </div>
      ) : isText ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="body-text">本文</Label>
            <Textarea
              id="body-text"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="長文のテキストを入力…"
              rows={10}
              autoFocus
              className="min-h-[200px] leading-relaxed"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>カードサイズ</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRODUCT_SIZES.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setProductSize(value)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left transition-colors",
                    productSize === value
                      ? "border-stone-800 bg-stone-50 ring-1 ring-stone-800"
                      : "border-stone-200 hover:border-stone-300",
                  )}
                >
                  <span className="block text-sm font-semibold text-stone-800">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-tight text-stone-400">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-url">商品URL</Label>
            <div className="flex gap-2">
              <Input
                id="product-url"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://..."
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={fetchOgp}
                disabled={fetching || !productUrl.trim()}
              >
                {fetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "自動入力"
                )}
              </Button>
            </div>
            {fetchError && (
              <p className="text-xs text-red-500">{fetchError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="商品名"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="brand">ブランド</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">価格</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="¥12,800"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-url">画像URL</Label>
            <Input
              id="image-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">こだわり・コメント</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="なぜ欲しいのか、どんなこだわりがあるのか..."
              rows={3}
            />
          </div>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2 border-t border-zinc-100 pt-4">
        <Button variant="outline" onClick={handleClose}>
          キャンセル
        </Button>
        <Button onClick={handleApply}>適用</Button>
      </div>
    </>
  );
}
