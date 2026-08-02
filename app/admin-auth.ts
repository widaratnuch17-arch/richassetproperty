import { notFound, redirect } from "next/navigation";
import {
  cloudflareAccessSignOutPath,
  getCloudflareAccessUser,
} from "./cloudflare-access-auth";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
  isChatGPTHost,
} from "./chatgpt-auth";
import { getPasswordUser } from "./password-auth";

export const OWNER_EMAIL = "widaratnuch17@gmail.com";

export type AdminUser = {
  displayName: string;
  email: string;
  fullName: string | null;
  provider: "chatgpt" | "cloudflare-access" | "password";
};

export async function requireOwner(returnTo: string): Promise<AdminUser> {
  const user = await getAdminUser();
  if (user?.email.toLowerCase() === OWNER_EMAIL) return user;
  if (user) notFound();

  if (await isChatGPTHost()) redirect(chatGPTSignInPath(returnTo));
  redirect(`/admin/login?return_to=${encodeURIComponent(returnTo)}`);
}

export async function isOwner() {
  const user = await getAdminUser();
  return user?.email.toLowerCase() === OWNER_EMAIL;
}

export function adminSignOutPath(user: AdminUser): string {
  if (user.provider === "cloudflare-access") return cloudflareAccessSignOutPath();
  if (user.provider === "password") return "/admin/logout";
  return chatGPTSignOutPath("/");
}

async function getAdminUser(): Promise<AdminUser | null> {
  const cloudflareUser = await getCloudflareAccessUser();
  if (cloudflareUser) {
    return { ...cloudflareUser, provider: "cloudflare-access" };
  }

  const chatGPTUser = await getChatGPTUser();
  if (chatGPTUser) return { ...chatGPTUser, provider: "chatgpt" };

  const passwordUser = await getPasswordUser();
  return passwordUser ? { ...passwordUser, provider: "password" } : null;
}
