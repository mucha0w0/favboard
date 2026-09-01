"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type Canvas } from "@/lib/types";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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

  async function handleDelete(id: string) {
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <AppHeader
        maxWidth="4xl"
        title={
          <Link href="/" className="text-base font-bold tracking-tight">
            Visual Wishlist
          </Link>
        }
        actions={
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            ログアウト
          </Button>
        }
      />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">マイリスト</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              欲しいもの・こだわりを、note のように綴ろう
            </p>
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            新規作成
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {canvases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
            <p className="text-sm text-zinc-500">まだリストがありません</p>
            <Button className="mt-4" onClick={handleCreate} disabled={creating}>
              最初のリストを作成
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {canvases.map((canvas) => (
              <Card key={canvas.id} className="border-zinc-200 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1 text-base">
                      {canvas.title}
                    </CardTitle>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        canvas.is_published
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {canvas.is_published ? "公開中" : "下書き"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-xs text-zinc-400">
                    {canvas.blocks.length} 件 ·{" "}
                    {new Date(canvas.updated_at).toLocaleDateString("ja-JP")}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/edit/${canvas.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Pencil className="h-3.5 w-3.5" />
                        編集
                      </Button>
                    </Link>
                    {canvas.is_published && (
                      <Link href={`/c/${canvas.slug}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(canvas.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
