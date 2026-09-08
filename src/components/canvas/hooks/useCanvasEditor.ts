"use client";

import {
  createTopLevelBlock,
  migrateCanvasBlocks,
  updateBentoChildData,
} from "@/lib/bento";
import {
  type Block,
  type BlockData,
  type Canvas,
  type TopLevelBlockType,
  blockDataEqual,
  blocksEqual,
} from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useCanvasEditor(initialCanvas: Canvas) {
  const router = useRouter();
  const [canvas, setCanvas] = useState(initialCanvas);
  const migratedInitial = useMemo(
    () => migrateCanvasBlocks(initialCanvas.blocks),
    [initialCanvas.blocks],
  );
  const [blocks, setBlocks] = useState<Block[]>(migratedInitial);
  const blocksRef = useRef(blocks);
  const [title, setTitle] = useState(initialCanvas.title);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editingBentoId, setEditingBentoId] = useState<string | null>(null);
  const [isNewBlock, setIsNewBlock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [pendingNewBlockIds, setPendingNewBlockIds] = useState<Set<string>>(
    () => new Set(),
  );
  const productPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    return () => {
      if (productPersistTimer.current) {
        clearTimeout(productPersistTimer.current);
      }
    };
  }, []);

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
        setBlocks(migrateCanvasBlocks(updated.blocks));
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

  function handleAddBlock(type: TopLevelBlockType) {
    const newBlock = createTopLevelBlock(type);
    const nextBlocks = [...blocks, newBlock];
    setBlocks(nextBlocks);

    if (type === "heading") {
      setFocusBlockId(newBlock.id);
      setPendingNewBlockIds((prev) => new Set(prev).add(newBlock.id));
      return;
    }

    persist(nextBlocks, title);
  }

  const handleReorder = useCallback(
    async (nextBlocks: Block[]) => {
      setBlocks(nextBlocks);
      await persist(nextBlocks, title);
    },
    [persist, title],
  );

  function handleEditBlock(
    block: Block,
    context?: { bentoId: string; isNew?: boolean },
  ) {
    if (block.type !== "product") return;
    setEditingBlock(block);
    setEditingBentoId(context?.bentoId ?? null);
    setIsNewBlock(Boolean(context?.isNew));
    setDialogOpen(true);
  }

  function handleUpdateBlockData(blockId: string, data: Partial<BlockData>) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, data: { ...b.data, ...data } } : b,
      ),
    );
  }

  function handleUpdateBento(bentoId: string, data: Partial<BlockData>) {
    const next = blocksRef.current.map((b) =>
      b.id === bentoId ? { ...b, data: { ...b.data, ...data } } : b,
    );
    blocksRef.current = next;
    setBlocks(next);
  }

  async function handlePersistBento(bentoId: string) {
    const bento = blocksRef.current.find((b) => b.id === bentoId);
    const saved = canvas.blocks.find((b) => b.id === bentoId);
    if (
      !bento ||
      (saved && blockDataEqual(saved.data, bento.data))
    ) {
      return;
    }
    await persist(blocksRef.current, title);
  }

  async function handleBlockBlur(blockId: string) {
    setFocusBlockId(null);

    const currentBlocks = blocksRef.current;
    const block = currentBlocks.find((b) => b.id === blockId);
    if (!block) return;

    const isPendingNew = pendingNewBlockIds.has(blockId);
    const isEmpty = block.type === "heading" && !block.data.text?.trim();

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
    if (saved && blockDataEqual(saved.data, block.data)) {
      return;
    }

    await persist(currentBlocks, title);
  }

  async function handleBentoChildBlur(bentoId: string, childId: string) {
    setFocusBlockId(null);

    const bento = blocksRef.current.find((b) => b.id === bentoId);
    const child = bento?.data.children?.find((c) => c.id === childId);
    if (!child || child.type !== "text") return;

    const isPendingNew = pendingNewBlockIds.has(childId);
    const isEmpty = !child.data.body?.trim();

    if (isPendingNew) {
      setPendingNewBlockIds((prev) => {
        const next = new Set(prev);
        next.delete(childId);
        return next;
      });
    }

    if (isPendingNew && isEmpty) {
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== bentoId) return b;
          return {
            ...b,
            data: {
              ...b.data,
              children: b.data.children?.filter((c) => c.id !== childId),
              child_placements: Object.fromEntries(
                Object.entries(b.data.child_placements ?? {}).filter(
                  ([id]) => id !== childId,
                ),
              ),
            },
          };
        }),
      );
      return;
    }

    await persist(blocksRef.current, title);
  }

  function handleProductDataChange(blockId: string, data: BlockData) {
    const bentoId = editingBentoId;
    const nextBlocks = blocksRef.current.map((b) => {
      if (bentoId && b.id === bentoId) {
        return updateBentoChildData(b, blockId, data);
      }
      if (b.id === blockId) {
        return { ...b, data: { ...b.data, ...data } };
      }
      return b;
    });

    blocksRef.current = nextBlocks;
    setBlocks(nextBlocks);

    if (productPersistTimer.current) {
      clearTimeout(productPersistTimer.current);
    }
    productPersistTimer.current = setTimeout(() => {
      productPersistTimer.current = null;
      void persist(blocksRef.current, title);
    }, 400);
  }

  function handleDialogClose() {
    if (productPersistTimer.current) {
      clearTimeout(productPersistTimer.current);
      productPersistTimer.current = null;
      void persist(blocksRef.current, title);
    }
    setIsNewBlock(false);
    setEditingBlock(null);
    setEditingBentoId(null);
    setDialogOpen(false);
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

  return {
    canvas,
    blocks,
    title,
    setTitle,
    saving,
    publishing,
    savedFlash,
    error,
    editingBlock,
    isNewBlock,
    dialogOpen,
    setDialogOpen,
    focusBlockId,
    isDirty,
    publicUrl: `/c/${canvas.slug}`,
    persist,
    handleSave,
    handleAddBlock,
    handleReorder,
    handleEditBlock,
    handleUpdateBlockData,
    handleUpdateBento,
    handlePersistBento,
    handleBlockBlur,
    handleBentoChildBlur,
    handleProductDataChange,
    handleDialogClose,
    handleDeleteBlock,
    handleTogglePublish,
    handleBackClick,
  };
}
