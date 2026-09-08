"use client";

import { BlockStream } from "@/components/canvas/BlockStream";
import { InsertMenu } from "@/components/canvas/InsertMenu";
import { ProductFormDialog } from "@/components/canvas/ProductFormDialog";
import { useCanvasEditor } from "@/components/canvas/hooks/useCanvasEditor";
import { AppHeader } from "@/components/layout/AppHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { type Canvas } from "@/lib/types";
import {
  Check,
  ExternalLink,
  EyeOff,
  Globe,
  Loader2,
  Save,
} from "lucide-react";
import Link from "next/link";

interface CanvasEditorProps {
  canvas: Canvas;
}

export function CanvasEditor({ canvas: initialCanvas }: CanvasEditorProps) {
  const editor = useCanvasEditor(initialCanvas);

  return (
    <div className="min-h-screen bg-stone-50">
      <AppHeader
        backHref="/dashboard"
        backLabel="一覧"
        onBackClick={editor.handleBackClick}
        maxWidth="4xl"
        title={
          <div className="flex items-center gap-2 text-xs text-stone-400">
            {editor.isDirty && <span className="text-stone-600">未保存</span>}
            {!editor.isDirty && editor.savedFlash && <span>保存済</span>}
            {!editor.isDirty && !editor.savedFlash && (
              <span>{editor.canvas.is_published ? "公開中" : "下書き"}</span>
            )}
          </div>
        }
        actions={
          <>
            <Link
              href={editor.publicUrl}
              target="_blank"
              className="hidden items-center gap-1 text-xs text-stone-500 hover:text-stone-800 sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              プレビュー
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={editor.handleSave}
              disabled={editor.saving || !editor.isDirty}
              className="text-stone-600"
            >
              {editor.saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editor.savedFlash ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              保存
            </Button>
            <Button
              size="sm"
              variant={editor.canvas.is_published ? "outline" : "default"}
              onClick={editor.handleTogglePublish}
              disabled={editor.publishing || editor.saving}
            >
              {editor.publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editor.canvas.is_published ? (
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
          {editor.error && (
            <Alert variant="error" className="mb-8">
              {editor.error}
            </Alert>
          )}

          <input
            type="text"
            value={editor.title}
            onChange={(e) => editor.setTitle(e.target.value)}
            onBlur={() => {
              if (editor.title !== editor.canvas.title) {
                editor.persist(editor.blocks, editor.title);
              }
            }}
            placeholder="タイトル"
            className="mb-10 w-full border-none bg-transparent text-[1.75rem] font-bold leading-tight tracking-tight text-stone-900 placeholder:text-stone-300 outline-none sm:text-[2rem]"
          />

          <BlockStream
            blocks={editor.blocks}
            editable
            onEditBlock={editor.handleEditBlock}
            onUpdateBlockData={editor.handleUpdateBlockData}
            onBlockBlur={editor.handleBlockBlur}
            focusBlockId={editor.focusBlockId}
            onDeleteBlock={editor.handleDeleteBlock}
            onReorder={editor.handleReorder}
            onUpdateBento={editor.handleUpdateBento}
            onBentoChildBlur={editor.handleBentoChildBlur}
            onPersistBento={editor.handlePersistBento}
          />

          <InsertMenu onAdd={editor.handleAddBlock} disabled={editor.saving} />
        </div>
      </main>

      {editor.editingBlock?.type === "product" && (
        <ProductFormDialog
          block={editor.editingBlock}
          open={editor.dialogOpen}
          isNew={editor.isNewBlock}
          onOpenChange={(open) => {
            if (open) editor.setDialogOpen(true);
            else editor.handleDialogClose();
          }}
          onChange={editor.handleProductDataChange}
        />
      )}
    </div>
  );
}
