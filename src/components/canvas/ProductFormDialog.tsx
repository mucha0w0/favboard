"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type Block, type BlockData, type OgpData } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [productUrl, setProductUrl] = useState("");
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [comment, setComment] = useState("");
  const [text, setText] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const isProduct = block?.type === "product";
  const isHeading = block?.type === "heading";

  useEffect(() => {
    if (!block) return;
    setProductUrl(block.data.product_url || "");
    setTitle(block.data.title || "");
    setBrand(block.data.brand || "");
    setPrice(block.data.price || "");
    setImageUrl(block.data.image_url || "");
    setComment(block.data.comment || "");
    setText(block.data.text || "");
    setFetchError("");
  }, [block]);

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
    if (!block) return;
    if (isHeading) {
      if (!text.trim()) return;
      onSave(block.id, { text: text.trim() });
    } else {
      onSave(block.id, {
        title: title.trim() || "Untitled Product",
        brand: brand.trim(),
        price: price.trim(),
        image_url: imageUrl.trim(),
        product_url: productUrl.trim(),
        comment: comment.trim(),
      });
    }
    onOpenChange(false);
  }

  const dialogTitle = isHeading
    ? isNew
      ? "見出しを追加"
      : "見出しを編集"
    : isProduct
      ? isNew
        ? "商品を追加"
        : "商品を編集"
      : "ブロックを編集";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}
      title={dialogTitle}
    >
      {isHeading ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heading-text">テキスト</Label>
            <Input
              id="heading-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="カテゴリ名やセクションタイトル"
              autoFocus
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-url">商品URL</Label>
            <div className="flex gap-2">
              <Input
                id="product-url"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://..."
                autoFocus
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
            <p className="text-xs text-zinc-400">
              URLからタイトル・画像を取得できます
            </p>
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
    </Dialog>
  );
}
