"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type Block, type BlockData } from "@/lib/types";
import { useState } from "react";
import { ProductImageInput } from "./ProductImageInput";

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
  const [title, setTitle] = useState(block.data.title || "");
  const [brand, setBrand] = useState(block.data.brand || "");
  const [price, setPrice] = useState(block.data.price || "");
  const [imageUrl, setImageUrl] = useState(block.data.image_url || "");
  const [comment, setComment] = useState(block.data.comment || "");

  function handleClose() {
    onCancel?.();
    onOpenChange(false);
  }

  function handleApply() {
    onSave(block.id, {
      title: title.trim() || "Untitled Product",
      brand: brand.trim(),
      price: price.trim(),
      image_url: imageUrl.trim(),
      comment: comment.trim(),
    });
    onOpenChange(false);
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="商品名"
            autoFocus
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
        <ProductImageInput value={imageUrl} onChange={setImageUrl} />
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
