"use client";

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
  onChange: (blockId: string, data: BlockData) => void;
}

export function ProductFormDialog({
  block,
  open,
  isNew = false,
  onOpenChange,
  onChange,
}: ProductFormDialogProps) {
  const dialogTitle = isNew ? "商品を追加" : "商品を編集";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
    >
      {block && (
        <ProductFormFields
          key={block.id}
          block={block}
          onChange={onChange}
        />
      )}
    </Dialog>
  );
}

function ProductFormFields({
  block,
  onChange,
}: {
  block: Block;
  onChange: (blockId: string, data: BlockData) => void;
}) {
  const [title, setTitle] = useState(block.data.title || "");
  const [brand, setBrand] = useState(block.data.brand || "");
  const [price, setPrice] = useState(block.data.price || "");
  const [imageUrl, setImageUrl] = useState(block.data.image_url || "");
  const [officialUrl, setOfficialUrl] = useState(
    block.data.official_url || "",
  );
  const [comment, setComment] = useState(block.data.comment || "");

  function commit(next: {
    title?: string;
    brand?: string;
    price?: string;
    image_url?: string;
    official_url?: string;
    comment?: string;
  }) {
    const merged = {
      title: next.title ?? title,
      brand: next.brand ?? brand,
      price: next.price ?? price,
      image_url: next.image_url ?? imageUrl,
      official_url: next.official_url ?? officialUrl,
      comment: next.comment ?? comment,
    };
    onChange(block.id, {
      title: merged.title.trim(),
      brand: merged.brand.trim(),
      price: merged.price.trim(),
      image_url: merged.image_url.trim(),
      official_url: merged.official_url.trim(),
      comment: merged.comment.trim(),
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => {
            const v = e.target.value;
            setTitle(v);
            commit({ title: v });
          }}
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
            onChange={(e) => {
              const v = e.target.value;
              setBrand(v);
              commit({ brand: v });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">価格</Label>
          <Input
            id="price"
            value={price}
            onChange={(e) => {
              const v = e.target.value;
              setPrice(v);
              commit({ price: v });
            }}
            placeholder="¥12,800"
          />
        </div>
      </div>
      <ProductImageInput
        value={imageUrl}
        onChange={(v) => {
          setImageUrl(v);
          commit({ image_url: v });
        }}
      />
      <div className="space-y-2">
        <Label htmlFor="official_url">公式サイト</Label>
        <Input
          id="official_url"
          type="url"
          value={officialUrl}
          onChange={(e) => {
            const v = e.target.value;
            setOfficialUrl(v);
            commit({ official_url: v });
          }}
          placeholder="https://example.com/product"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="comment">こだわり・コメント</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => {
            const v = e.target.value;
            setComment(v);
            commit({ comment: v });
          }}
          placeholder="なぜ欲しいのか、どんなこだわりがあるのか..."
          rows={3}
        />
      </div>
    </div>
  );
}
