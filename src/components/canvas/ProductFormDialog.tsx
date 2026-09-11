"use client";

import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_PRICE_CURRENCY,
  parseStoredPrice,
  sanitizePriceInput,
  type Block,
  type BlockData,
  type ImageCrop,
  type PriceCurrency,
} from "@/lib/types";
import { useState } from "react";
import { ProductImageInput } from "./ProductImageInput";

interface ProductFormDialogProps {
  block: Block | null;
  open: boolean;
  isNew?: boolean;
  cropCellSpan?: { colSpan: number; rowSpan: number };
  onOpenChange: (open: boolean) => void;
  onChange: (blockId: string, data: BlockData) => void;
}

export function ProductFormDialog({
  block,
  open,
  isNew = false,
  cropCellSpan,
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
          cropCellSpan={cropCellSpan}
          onChange={onChange}
        />
      )}
    </Dialog>
  );
}

function ProductFormFields({
  block,
  cropCellSpan,
  onChange,
}: {
  block: Block;
  cropCellSpan?: { colSpan: number; rowSpan: number };
  onChange: (blockId: string, data: BlockData) => void;
}) {
  const initialPrice = parseStoredPrice(
    block.data.price,
    block.data.price_currency,
  );
  const [title, setTitle] = useState(block.data.title || "");
  const [brand, setBrand] = useState(block.data.brand || "");
  const [price, setPrice] = useState(initialPrice.amount);
  const [priceCurrency, setPriceCurrency] = useState<PriceCurrency>(
    initialPrice.currency,
  );
  const [imageUrl, setImageUrl] = useState(block.data.image_url || "");
  const [imageCrop, setImageCrop] = useState<ImageCrop | undefined>(
    block.data.image_crop,
  );
  const [officialUrl, setOfficialUrl] = useState(
    block.data.official_url || "",
  );
  const [comment, setComment] = useState(block.data.comment || "");

  function commit(next: {
    title?: string;
    brand?: string;
    price?: string;
    price_currency?: PriceCurrency;
    image_url?: string;
    image_crop?: ImageCrop | undefined;
    official_url?: string;
    comment?: string;
  }) {
    const merged = {
      title: next.title ?? title,
      brand: next.brand ?? brand,
      price: next.price ?? price,
      price_currency: next.price_currency ?? priceCurrency,
      image_url: next.image_url ?? imageUrl,
      image_crop: next.image_crop !== undefined ? next.image_crop : imageCrop,
      official_url: next.official_url ?? officialUrl,
      comment: next.comment ?? comment,
    };
    onChange(block.id, {
      title: merged.title.trim(),
      brand: merged.brand.trim(),
      price: sanitizePriceInput(merged.price).trim(),
      price_currency: merged.price_currency || DEFAULT_PRICE_CURRENCY,
      image_url: merged.image_url.trim(),
      image_crop: merged.image_crop,
      official_url: merged.official_url.trim(),
      comment: merged.comment.trim(),
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">商品名</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => {
            const v = e.target.value;
            setTitle(v);
            commit({ title: v });
          }}
          placeholder="ProPad Air 11インチ"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="brand">ブランド名</Label>
          <Input
            id="brand"
            value={brand}
            onChange={(e) => {
              const v = e.target.value;
              setBrand(v);
              commit({ brand: v });
            }}
            placeholder="Ample"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">価格</Label>
          <div className="flex items-end gap-2">
            <select
              id="price_currency"
              aria-label="通貨"
              value={priceCurrency}
              onChange={(e) => {
                const v = e.target.value as PriceCurrency;
                setPriceCurrency(v);
                commit({ price_currency: v });
              }}
              className="field-input h-9 w-12 shrink-0 cursor-pointer text-sm text-stone-900 focus-visible:outline-none"
            >
              <option value="¥">¥</option>
              <option value="$">$</option>
            </select>
            <Input
              id="price"
              inputMode="decimal"
              value={price}
              onChange={(e) => {
                const v = sanitizePriceInput(e.target.value);
                setPrice(v);
                commit({ price: v });
              }}
              placeholder="12,800"
              className="min-w-0 flex-1"
            />
          </div>
        </div>
      </div>
      <ProductImageInput
        value={imageUrl}
        crop={imageCrop}
        cellSpan={cropCellSpan}
        onChange={(v) => {
          setImageUrl(v);
          setImageCrop(undefined);
          commit({ image_url: v, image_crop: undefined });
        }}
        onCropChange={(crop) => {
          setImageCrop(crop);
          commit({ image_crop: crop });
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
