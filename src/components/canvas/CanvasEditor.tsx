"use client";

import { BlockStream } from "@/components/canvas/BlockStream";
import { InsertMenu } from "@/components/canvas/InsertMenu";
import { ProductFormDialog } from "@/components/canvas/ProductFormDialog";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/canvas/ViewModeToggle";
import { useCanvasEditor } from "@/components/canvas/hooks/useCanvasEditor";
import { AppHeader } from "@/components/layout/AppHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { type Canvas } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, EyeOff, Globe, Loader2, Save } from "lucide-react";
import { useState } from "react";

interface CanvasEditorProps {
  canvas: Canvas;
}

const TITLE_CLASS =
  "mb-10 w-full border-none bg-transparent text-[1.75rem] font-bold leading-tight tracking-tight text-stone-900 outline-none sm:text-[2rem]";

export function CanvasEditor({ canvas: initialCanvas }: CanvasEditorProps) {
  const editor = useCanvasEditor(initialCanvas);
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const isEditing = viewMode === "edit";

  function handleViewModeChange(mode: ViewMode) {
    if (mode === "preview" && editor.dialogOpen) {
      editor.handleDialogClose();
    }
    setViewMode(mode);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <AppHeader
        backHref="/dashboard"
        backLabel="一覧"
        onBackClick={editor.handleBackClick}
        maxWidth="4xl"
        title={
          <div className="hidden items-center gap-2 text-xs text-stone-400 sm:flex">
            {editor.isDirty && <span className="text-stone-600">未保存</span>}
            {!editor.isDirty && editor.savedFlash && <span>保存済</span>}
            {!editor.isDirty && !editor.savedFlash && (
              <span>{editor.canvas.is_published ? "公開中" : "下書き"}</span>
            )}
          </div>
        }
        actions={
          <>
            <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
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

          {isEditing ? (
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
              className={`${TITLE_CLASS} placeholder:text-stone-300`}
            />
          ) : (
            <h1 className={cn(TITLE_CLASS, !editor.title && "text-stone-300")}>
              {editor.title || "タイトル"}
            </h1>
          )}

          <BlockStream
            blocks={editor.blocks}
            editable={isEditing}
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

          {isEditing && (
            <InsertMenu onAdd={editor.handleAddBlock} disabled={editor.saving} />
          )}
        </div>
      </main>

      {isEditing && editor.editingBlock?.type === "product" && (
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
