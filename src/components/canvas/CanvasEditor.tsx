"use client";

import { BlockStream } from "@/components/canvas/BlockStream";
import { InsertMenu } from "@/components/canvas/InsertMenu";
import { ProductFormDialog } from "@/components/canvas/ProductFormDialog";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/canvas/ViewModeToggle";
import { useCanvasEditor } from "@/components/canvas/hooks/useCanvasEditor";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { type Canvas } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EyeOff, Globe, Loader2 } from "lucide-react";
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
      <SiteHeader
        onBrandClick={editor.handleBackClick}
        center={
          <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
        }
        actions={
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
                公開中
              </>
            )}
          </Button>
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
          cropCellSpan={editor.editingCellSpan}
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
