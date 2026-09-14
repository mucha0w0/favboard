"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CONFIRM_PHRASE = "退会する";

export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const canDelete = confirmText === CONFIRM_PHRASE && !deleting;

  function handleOpenChange(next: boolean) {
    if (deleting) return;
    setOpen(next);
    if (!next) {
      setConfirmText("");
      setError("");
    }
  }

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "アカウントの削除に失敗しました",
        );
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setError("アカウントの削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="mt-16 border-t border-stone-200/80 pt-10 sm:mt-20 sm:pt-12">
      <h2 className="mb-2 text-lg font-semibold text-stone-900">アカウント</h2>
      <p className="mb-6 max-w-xl text-xs leading-relaxed text-stone-400">
        退会すると、プロフィールとすべてのリスト（公開中のもの含む）が削除され、元に戻せません。
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
        onClick={() => setOpen(true)}
      >
        アカウントを削除
      </Button>

      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        title="アカウントを削除しますか？"
        titleClassName="text-base font-semibold"
        className="max-w-md"
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-stone-600">
            この操作は取り消せません。プロフィール、認証情報、およびすべてのリストが完全に削除されます。
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="delete-confirm">
              確認のため「{CONFIRM_PHRASE}」と入力してください
            </Label>
            <Input
              id="delete-confirm"
              value={confirmText}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              disabled={deleting}
              placeholder={CONFIRM_PHRASE}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError("");
              }}
            />
          </div>

          {error && (
            <Alert variant="error" className="mb-0">
              {error}
            </Alert>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={deleting}
              onClick={() => handleOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={!canDelete}
              onClick={() => void handleDelete()}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              退会する
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
