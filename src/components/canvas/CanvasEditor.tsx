"use client";

import { BlockStream, createBlock } from "@/components/canvas/BlockStream";
import { InsertMenu } from "@/components/canvas/InsertMenu";
import { ProductFormDialog } from "@/components/canvas/ProductFormDialog";
import { AppHeader } from "@/components/layout/AppHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  type Block,
  type BlockData,
  type BlockType,
  type Canvas,
} from "@/lib/types";
import {
  Check,
  ExternalLink,
  EyeOff,
  Globe,
  Loader2,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface CanvasEditorProps {
  canvas: Canvas;
}

function blocksEqual(a: Block[], b: Block[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function CanvasEditor({ canvas: initialCanvas }: CanvasEditorProps) {
  const router = useRouter();
  const [canvas, setCanvas] = useState(initialCanvas);
  const [blocks, setBlocks] = useState<Block[]>(initialCanvas.blocks);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const [title, setTitle] = useState(initialCanvas.title);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [isNewBlock, setIsNewBlock] = useState(false);
  const [pendingInsertIndex, setPendingInsertIndex] = useState<number | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [pendingNewBlockIds, setPendingNewBlockIds] = useState<Set<string>>(
    () => new Set(),
  );

  const isDirty = useMemo(
    () => title !== canvas.title || !blocksEqual(blocks, canvas.blocks),
    [title, blocks, canvas.title, canvas.blocks],
  );

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const persist = useCallback(
    async (
      nextBlocks: Block[],
      nextTitle: string,
      updates: Partial<Canvas> = {},
    ): Promise<boolean> => {
      setSaving(true);
      setError("");
      setSavedFlash(false);
      try {
        const res = await fetch(`/api/canvases/${canvas.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: nextTitle,
            blocks: nextBlocks,
            ...updates,
          }),
        });

        if (res.status === 401) {
          router.push("/login");
          return false;
        }

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "保存に失敗しました");
          return false;
        }

        const updated = data as Canvas;
        setCanvas(updated);
        setTitle(updated.title);
        setBlocks(updated.blocks);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
        return true;
      } catch {
        setError("保存に失敗しました");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [canvas.id, router],
  );

  async function handleSave() {
    await persist(blocks, title);
  }

  function handleAddBlock(type: BlockType, index?: number) {
    const newBlock = createBlock(type);
    if (type === "product") {
      setEditingBlock(newBlock);
      setIsNewBlock(true);
      setPendingInsertIndex(index ?? blocks.length);
      setDialogOpen(true);
      return;
    }

    const insertAt = index ?? blocks.length;
    const nextBlocks = [
      ...blocks.slice(0, insertAt),
      newBlock,
      ...blocks.slice(insertAt),
    ];
    setBlocks(nextBlocks);

    if (type === "heading" || type === "text") {
      setFocusBlockId(newBlock.id);
      setPendingNewBlockIds((prev) => new Set(prev).add(newBlock.id));
      return;
    }

    persist(nextBlocks, title);
  }

  async function handleReorder(nextBlocks: Block[]) {
    setBlocks(nextBlocks);
    await persist(nextBlocks, title);
  }

  function handleEditBlock(block: Block) {
    if (block.type !== "product") return;
    setEditingBlock(block);
    setIsNewBlock(false);
    setDialogOpen(true);
  }

  function handleUpdateBlockData(blockId: string, data: BlockData) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, data: { ...b.data, ...data } } : b,
      ),
    );
  }

  async function handleBlockBlur(blockId: string) {
    setFocusBlockId(null);

    const currentBlocks = blocksRef.current;
    const block = currentBlocks.find((b) => b.id === blockId);
    if (!block) return;

    const isPendingNew = pendingNewBlockIds.has(blockId);
    const isEmpty =
      (block.type === "heading" && !block.data.text?.trim()) ||
      (block.type === "text" && !block.data.body?.trim());

    if (isPendingNew) {
      setPendingNewBlockIds((prev) => {
        const next = new Set(prev);
        next.delete(blockId);
        return next;
      });
    }

    if (isPendingNew && isEmpty) {
      setBlocks(currentBlocks.filter((b) => b.id !== blockId));
      return;
    }

    const saved = canvas.blocks.find((b) => b.id === blockId);
    if (saved && JSON.stringify(saved.data) === JSON.stringify(block.data)) {
      return;
    }

    await persist(currentBlocks, title);
  }

  async function handleApplyBlockData(blockId: string, data: BlockData) {
    let nextBlocks: Block[];

    if (isNewBlock && editingBlock?.id === blockId) {
      const insertAt = pendingInsertIndex ?? blocks.length;
      nextBlocks = [
        ...blocks.slice(0, insertAt),
        { ...editingBlock, data },
        ...blocks.slice(insertAt),
      ];
      setIsNewBlock(false);
      setPendingInsertIndex(null);
    } else {
      nextBlocks = blocks.map((b) =>
        b.id === blockId ? { ...b, data: { ...b.data, ...data } } : b,
      );
    }

    setBlocks(nextBlocks);
    setEditingBlock(null);
    await persist(nextBlocks, title);
  }

  function handleDialogCancel() {
    setIsNewBlock(false);
    setPendingInsertIndex(null);
    setEditingBlock(null);
  }

  async function handleDeleteBlock(blockId: string) {
    const nextBlocks = blocks.filter((b) => b.id !== blockId);
    setBlocks(nextBlocks);
    await persist(nextBlocks, title);
  }

  async function handleTogglePublish() {
    setPublishing(true);
    setError("");
    const nextPublished = !canvas.is_published;
    const ok = await persist(blocks, title, { is_published: nextPublished });
    if (!ok) {
      setError(
        nextPublished ? "公開に失敗しました" : "非公開に失敗しました",
      );
    }
    setPublishing(false);
  }

  function handleBackClick(e: React.MouseEvent) {
    if (!isDirty) return;
    if (!confirm("未保存の変更があります。ページを離れますか？")) {
      e.preventDefault();
    }
  }

  const publicUrl = `/c/${canvas.slug}`;

  return (
    <div className="min-h-screen bg-stone-50">
      <AppHeader
        backHref="/dashboard"
        backLabel="一覧"
        onBackClick={handleBackClick}
        maxWidth="4xl"
        title={
          <div className="flex items-center gap-2 text-xs text-stone-400">
            {isDirty && <span className="text-stone-600">未保存</span>}
            {!isDirty && savedFlash && <span>保存済</span>}
            {!isDirty && !savedFlash && (
              <span>{canvas.is_published ? "公開中" : "下書き"}</span>
            )}
          </div>
        }
        actions={
          <>
            <Link
              href={publicUrl}
              target="_blank"
              className="hidden items-center gap-1 text-xs text-stone-500 hover:text-stone-800 sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              プレビュー
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="text-stone-600"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : savedFlash ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              保存
            </Button>
            <Button
              size="sm"
              variant={canvas.is_published ? "outline" : "default"}
              onClick={handleTogglePublish}
              disabled={publishing || saving}
              className={canvas.is_published ? "" : undefined}
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : canvas.is_published ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  非公開
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  公開
                </>
              )}
            </Button>
          </>
        }
      />

      <main className="px-4 py-8 sm:px-6">
        <div className="content-column min-h-[60vh] py-6 sm:py-10">
          {error && (
            <Alert variant="error" className="mb-8">
              {error}
            </Alert>
          )}

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title !== canvas.title) {
                persist(blocks, title);
              }
            }}
            placeholder="タイトル"
            className="mb-10 w-full border-none bg-transparent text-[1.75rem] font-bold leading-tight text-stone-900 placeholder:text-stone-300 outline-none sm:text-[2rem]"
          />

          <BlockStream
            blocks={blocks}
            editable
            onEditBlock={handleEditBlock}
            onUpdateBlockData={handleUpdateBlockData}
            onBlockBlur={handleBlockBlur}
            focusBlockId={focusBlockId}
            onDeleteBlock={handleDeleteBlock}
            onReorder={handleReorder}
            onInsertBlock={handleAddBlock}
          />

          <InsertMenu onAdd={handleAddBlock} disabled={saving} />
        </div>
      </main>

      {editingBlock?.type === "product" && (
        <ProductFormDialog
          block={editingBlock}
          open={dialogOpen}
          isNew={isNewBlock}
          onOpenChange={setDialogOpen}
          onSave={handleApplyBlockData}
          onCancel={handleDialogCancel}
        />
      )}
    </div>
  );
}
