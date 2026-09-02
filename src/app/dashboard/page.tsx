"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { type Canvas } from "@/lib/types";
import { ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/canvases");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          setError(data.error || "一覧の取得に失敗しました");
          return;
        }
        setCanvases(data);
      } catch {
        setError("一覧の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleCreate() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/canvases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "新しいリスト" }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "作成に失敗しました");
        return;
      }
      router.push(`/edit/${data.id}`);
    } catch {
      setError("作成に失敗しました");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("このリストを削除しますか？")) return;
    setError("");
    try {
      const res = await fetch(`/api/canvases/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "削除に失敗しました");
        return;
      }
      setCanvases((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("削除に失敗しました");
    }
  }

  async function handleSignOut() {
    const modeRes = await fetch("/api/auth/mode");
    const { mode } = await modeRes.json();

    if (mode === "local") {
      await fetch("/api/auth/logout", { method: "POST" });
    } else {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <Loader2 className="h-5 w-5 animate-spin text-stone-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <AppHeader
        maxWidth="4xl"
        title={
          <Link
            href="/"
            className="text-sm font-medium tracking-tight text-stone-900"
          >
            Visual Wishlist
          </Link>
        }
        actions={
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            ログアウト
          </Button>
        }
      />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-lg font-medium text-stone-900">マイリスト</h1>
            <p className="mt-1 text-sm text-stone-500">
              {canvases.length} 件のリスト
            </p>
          </div>
          <Button onClick={handleCreate} disabled={creating} size="sm">
            {creating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            新規作成
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {canvases.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-200 py-20 text-center">
            <p className="text-sm text-stone-400">まだリストがありません</p>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={handleCreate}
              disabled={creating}
            >
              最初のリストを作成
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
            {canvases.map((canvas) => (
              <li key={canvas.id}>
                <Link
                  href={`/edit/${canvas.id}`}
                  className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-stone-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">
                      {canvas.title}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {canvas.blocks.length} ブロック ·{" "}
                      {new Date(canvas.updated_at).toLocaleDateString("ja-JP")}
                      {canvas.is_published && (
                        <span className="text-stone-500"> · 公開中</span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {canvas.is_published && (
                      <span
                        role="link"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(`/c/${canvas.slug}`, "_blank");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(`/c/${canvas.slug}`, "_blank");
                          }
                        }}
                        className="cursor-pointer rounded-md px-2 py-1 text-xs text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                      >
                        公開ページ
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(canvas.id, e)}
                      className="rounded-md p-1.5 text-stone-300 opacity-0 transition-all hover:bg-stone-100 hover:text-red-500 group-hover:opacity-100"
                      aria-label="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-stone-300" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
