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
  const titleRef = useRef(title);
  const canvasRef = useRef(canvas);
  const persistSeq = useRef(0);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editingBentoId, setEditingBentoId] = useState<string | null>(null);
  const [isNewBlock, setIsNewBlock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const productPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    canvasRef.current = canvas;
  }, [canvas]);

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
      const seq = ++persistSeq.current;
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
          if (seq === persistSeq.current) {
            setError(data.error || "保存に失敗しました");
          }
          return false;
        }

        const updated = data as Canvas;
        const migrated = migrateCanvasBlocks(updated.blocks);

        // 古い保存の応答で、リサイズ後のローカル状態を巻き戻さない
        if (seq !== persistSeq.current) {
          return true;
        }

        setCanvas({ ...updated, blocks: migrated });
        if (titleRef.current === nextTitle) {
          setTitle(updated.title);
        }
        if (
          blocksEqual(blocksRef.current, nextBlocks) &&
          !blocksEqual(blocksRef.current, migrated)
        ) {
          setBlocks(migrated);
        }
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
        return true;
      } catch {
        if (seq === persistSeq.current) {
          setError("保存に失敗しました");
        }
        return false;
      } finally {
        if (seq === persistSeq.current) {
          setSaving(false);
        }
      }
    },
    [canvas.id, router],
  );

  function handleAddBlock(type: TopLevelBlockType) {
    const newBlock = createTopLevelBlock(type);
    const nextBlocks = [...blocks, newBlock];
    setBlocks(nextBlocks);

    if (type === "heading") {
      setFocusBlockId(newBlock.id);
      return;
    }

    persist(nextBlocks, titleRef.current);
  }

  const handleReorder = useCallback(
    async (nextBlocks: Block[]) => {
      setBlocks(nextBlocks);
      await persist(nextBlocks, titleRef.current);
    },
    [persist],
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

  const handleUpdateBento = useCallback(
    (bentoId: string, data: Partial<BlockData>) => {
      const next = blocksRef.current.map((b) =>
        b.id === bentoId ? { ...b, data: { ...b.data, ...data } } : b,
      );
      blocksRef.current = next;
      setBlocks(next);
    },
    [],
  );

  const handlePersistBento = useCallback(
    async (bentoId: string) => {
      const bento = blocksRef.current.find((b) => b.id === bentoId);
      const saved = canvasRef.current.blocks.find((b) => b.id === bentoId);
      if (!bento || (saved && blockDataEqual(saved.data, bento.data))) {
        return;
      }
      await persist(blocksRef.current, titleRef.current);
    },
    [persist],
  );

  async function handleBlockBlur(blockId: string) {
    setFocusBlockId(null);

    const currentBlocks = blocksRef.current;
    const block = currentBlocks.find((b) => b.id === blockId);
    if (!block) return;

    const saved = canvasRef.current.blocks.find((b) => b.id === blockId);
    if (saved && blockDataEqual(saved.data, block.data)) {
      return;
    }

    await persist(currentBlocks, titleRef.current);
  }

  async function handleBentoChildBlur(bentoId: string, childId: string) {
    setFocusBlockId(null);

    const bento = blocksRef.current.find((b) => b.id === bentoId);
    const child = bento?.data.children?.find((c) => c.id === childId);
    if (!child || child.type !== "text") return;

    await persist(blocksRef.current, titleRef.current);
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
      void persist(blocksRef.current, titleRef.current);
    }, 400);
  }

  function handleDialogClose() {
    if (productPersistTimer.current) {
      clearTimeout(productPersistTimer.current);
      productPersistTimer.current = null;
      void persist(blocksRef.current, titleRef.current);
    }
    setIsNewBlock(false);
    setEditingBlock(null);
    setEditingBentoId(null);
    setDialogOpen(false);
  }

  async function handleDeleteBlock(blockId: string) {
    const nextBlocks = blocks.filter((b) => b.id !== blockId);
    setBlocks(nextBlocks);
    await persist(nextBlocks, titleRef.current);
  }

  async function handleTogglePublish() {
    setPublishing(true);
    setError("");
    const nextPublished = !canvasRef.current.is_published;
    const ok = await persist(blocksRef.current, titleRef.current, {
      is_published: nextPublished,
    });
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
    persist,
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
