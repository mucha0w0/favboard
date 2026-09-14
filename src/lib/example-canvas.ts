import { migrateCanvasBlocks } from "@/lib/bento";
import exampleCanvas from "@/data/example-canvas.json";
import {
  type Block,
  type BlockData,
  type BentoCellPlacement,
} from "@/lib/types";

export type ExampleCanvasSnapshot = {
  title: string;
  blocks: Block[];
};

function isExampleCanvasSnapshot(value: unknown): value is ExampleCanvasSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as { title?: unknown; blocks?: unknown };
  return typeof v.title === "string" && Array.isArray(v.blocks);
}

/** Returns the adopted example list, or null if none is configured. */
export function getExampleCanvasSnapshot(): ExampleCanvasSnapshot | null {
  if (!isExampleCanvasSnapshot(exampleCanvas)) return null;
  if (!exampleCanvas.title.trim() || exampleCanvas.blocks.length === 0) {
    return null;
  }
  return {
    title: exampleCanvas.title,
    blocks: exampleCanvas.blocks as Block[],
  };
}

function cloneBlock(block: Block): Block {
  const idMap = new Map<string, string>();

  function nextId(oldId: string): string {
    const existing = idMap.get(oldId);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    idMap.set(oldId, fresh);
    return fresh;
  }

  function cloneData(data: BlockData): BlockData {
    const next: BlockData = { ...data };

    if (Array.isArray(data.children)) {
      next.children = data.children.map((child) => ({
        ...child,
        id: nextId(child.id),
        data: cloneData(child.data),
      }));
    }

    if (data.child_placements) {
      const remapped: Record<string, BentoCellPlacement> = {};
      for (const [oldChildId, placement] of Object.entries(
        data.child_placements,
      )) {
        remapped[nextId(oldChildId)] = { ...placement };
      }
      next.child_placements = remapped;
    }

    if (data.image_crop) {
      next.image_crop = { ...data.image_crop };
    }

    return next;
  }

  return {
    ...block,
    id: nextId(block.id),
    data: cloneData(block.data),
  };
}

/** Deep-clone snapshot blocks with fresh IDs (including bento placements). */
export function cloneExampleBlocks(blocks: Block[]): Block[] {
  return migrateCanvasBlocks(blocks.map(cloneBlock));
}
