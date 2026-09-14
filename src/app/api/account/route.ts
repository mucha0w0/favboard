import { deleteAllProductImagesForUser } from "@/lib/product-images";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    await deleteAllProductImagesForUser(admin, user.id);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("Failed to delete auth user:", error.message);
      return NextResponse.json(
        { error: "アカウントの削除に失敗しました" },
        { status: 500 },
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "アカウントの削除に失敗しました";
    if (/SERVICE_ROLE_KEY|サービスロール/.test(message)) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    console.error("Failed to delete account:", message);
    return NextResponse.json(
      { error: "アカウントの削除に失敗しました" },
      { status: 500 },
    );
  }

  // Best-effort cookie clear; user row is already gone.
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  return NextResponse.json({ success: true });
}
