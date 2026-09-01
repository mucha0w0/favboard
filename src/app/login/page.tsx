"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingMode, setCheckingMode] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      setMessage("認証に失敗しました。もう一度お試しください。");
    }
    fetch("/api/auth/mode")
      .then((r) => r.json())
      .then((data) => setIsLocalMode(data.mode === "local"))
      .finally(() => setCheckingMode(false));
  }, [searchParams]);

  async function handleLocalLogin() {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/auth/local", { method: "POST" });

    if (res.ok) {
      router.push(redirect);
    } else {
      setMessage("ログインに失敗しました");
    }
    setLoading(false);
  }

  async function handleSupabaseLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
        },
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "確認メールを送信しました。メール内のリンクからログインしてください。",
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else {
        router.push(redirect);
      }
    }

    setLoading(false);
  }

  if (checkingMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Visual Wishlist
          </Link>
          <p className="mt-2 text-sm text-zinc-500">
            {isLocalMode
              ? "ローカルモード — すぐに使えます"
              : isSignUp
                ? "アカウントを作成"
                : "ログインしてリストを編集"}
          </p>
        </div>

        {message && (
          <Alert
            variant={message.includes("送信") ? "info" : "error"}
            className="mb-4"
          >
            {message}
          </Alert>
        )}

        {isLocalMode ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-xs leading-relaxed text-zinc-500">
              データはこのPCの <code className="text-zinc-700">.data/</code>{" "}
              フォルダに保存されます。Supabase を設定するとクラウド同期できます。
            </p>
            <Button
              className="w-full"
              onClick={handleLocalLogin}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              はじめる
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSupabaseLogin}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="mt-6 w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignUp ? "アカウント作成" : "ログイン"}
            </Button>
            <button
              type="button"
              className="mt-4 w-full text-center text-xs text-zinc-500 hover:text-zinc-900"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage("");
              }}
            >
              {isSignUp
                ? "すでにアカウントをお持ちの方はこちら"
                : "新規アカウントを作成"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
