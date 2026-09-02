"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PRODUCT_SIZES,
  getProductSize,
  type Block,
  type BlockData,
  type OgpData,
  type ProductSize,
} from "@/lib/types";
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

  const dialogTitle = isNew ? "商品を追加" : "商品を編集";

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
  const [productSize, setProductSize] = useState<ProductSize>(
    getProductSize(block),
  );
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

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
    onSave(block.id, {
      title: title.trim() || "Untitled Product",
      brand: brand.trim(),
      price: price.trim(),
      image_url: imageUrl.trim(),
      product_url: productUrl.trim(),
      comment: comment.trim(),
      product_size: productSize,
    });
    onOpenChange(false);
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>カードサイズ</Label>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_SIZES.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={productSize === value ? "default" : "ghost"}
                onClick={() => setProductSize(value)}
              >
                {label}
              </Button>
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
      <div className="mt-8 flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose}>
          キャンセル
        </Button>
        <Button onClick={handleApply}>適用</Button>
      </div>
    </>
  );
}
