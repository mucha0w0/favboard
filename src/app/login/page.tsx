import { LoginForm } from "./login-form";
import { getAuthUserId } from "@/lib/canvas-service";
import { safeInternalPath } from "@/lib/utils";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const userId = await getAuthUserId();
  if (userId) {
    redirect(safeInternalPath(params.redirect));
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
