"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { safeInternalPath } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const redirectTo = safeInternalPath(searchParams.get("redirect"));
  const authErrorMessage =
    searchParams.get("error") === "auth"
      ? "認証に失敗しました。もう一度お試しください。"
      : "";
  const displayMessage = message || authErrorMessage;

  async function handleXLogin() {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "x",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-5">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="text-sm font-medium tracking-tight text-stone-900 transition-opacity hover:opacity-70"
          >
            Favboard
          </Link>
          <p className="mt-3 text-sm text-stone-500">
            Xアカウントでログイン・新規登録
          </p>
        </div>

        {displayMessage && (
          <Alert variant="error" className="mb-6 text-center">
            {displayMessage}
          </Alert>
        )}

        <Button
          type="button"
          className="w-full bg-black text-white hover:bg-neutral-800"
          onClick={handleXLogin}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="text-base leading-none" aria-hidden>
              𝕏
            </span>
          )}
          Xでログイン
        </Button>
      </div>
    </div>
  );
}
