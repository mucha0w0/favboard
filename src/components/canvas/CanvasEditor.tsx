"use client";

import { BlockStream } from "@/components/canvas/BlockStream";
import { InsertMenu } from "@/components/canvas/InsertMenu";
import { ProductFormDialog } from "@/components/canvas/ProductFormDialog";
import { PublishSuccessDialog } from "@/components/canvas/PublishSuccessDialog";
import {
  ViewModeToggle,
  type ViewMode,
} from "@/components/canvas/ViewModeToggle";
import { useCanvasEditor } from "@/components/canvas/hooks/useCanvasEditor";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { type Canvas } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExternalLink, EyeOff, Globe, Loader2 } from "lucide-react";
import Link from "next/link";
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
    <div className="flex min-h-screen flex-col bg-stone-50">
      <SiteHeader
        onBrandClick={editor.handleBackClick}
        center={
          <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
        }
        actions={
          <>
            {editor.canvas.is_published && (
              <Link
                href={`/c/${editor.canvas.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center gap-2 rounded-full px-3 text-xs font-medium text-stone-600 transition-all duration-200 hover:bg-stone-100/80 hover:text-stone-900"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">公開ページ</span>
              </Link>
            )}
            <Button
              size="sm"
              variant={editor.canvas.is_published ? "default" : "outline"}
              onClick={editor.handleTogglePublish}
              disabled={editor.publishing || editor.saving}
              aria-pressed={editor.canvas.is_published}
              title={
                editor.canvas.is_published
                  ? "クリックで非公開にする"
                  : "クリックで公開する"
              }
            >
              {editor.publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editor.canvas.is_published ? (
                <>
                  <Globe className="h-4 w-4" />
                  公開中
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  非公開
                </>
              )}
            </Button>
          </>
        }
      />

      <main className="flex-1 px-4 py-8 sm:px-6">
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

      <SiteFooter />

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

      <PublishSuccessDialog
        open={editor.publishSuccessOpen}
        onOpenChange={editor.setPublishSuccessOpen}
        slug={editor.canvas.slug}
        title={editor.title || editor.canvas.title}
        updatedAt={editor.canvas.updated_at}
      />
    </div>
  );
}
