import { LOCAL_DEV_USER_ID } from "@/lib/config";
import { cookies } from "next/headers";

export const LOCAL_AUTH_COOKIE = "local_auth";

export async function getLocalSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(LOCAL_AUTH_COOKIE);
  return session?.value === "1" ? LOCAL_DEV_USER_ID : null;
}

export async function setLocalSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(LOCAL_AUTH_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearLocalSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(LOCAL_AUTH_COOKIE);
}
