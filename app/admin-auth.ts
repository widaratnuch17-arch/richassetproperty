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

export const OWNER_EMAIL = "widaratnuch17@gmail.com";

export type AdminUser = {
  displayName: string;
  email: string;
  fullName: string | null;
  provider: "chatgpt" | "cloudflare-access";
};

export async function requireOwner(returnTo: string): Promise<AdminUser> {
  const user = await getAdminUser();
  if (user?.email.toLowerCase() === OWNER_EMAIL) return user;
  if (user) notFound();

  if (await isChatGPTHost()) redirect(chatGPTSignInPath(returnTo));
  notFound();
}

export async function isOwner() {
  const user = await getAdminUser();
  return user?.email.toLowerCase() === OWNER_EMAIL;
}

export function adminSignOutPath(user: AdminUser): string {
  return user.provider === "cloudflare-access"
    ? cloudflareAccessSignOutPath()
    : chatGPTSignOutPath("/");
}

async function getAdminUser(): Promise<AdminUser | null> {
  const cloudflareUser = await getCloudflareAccessUser();
  if (cloudflareUser) {
    return { ...cloudflareUser, provider: "cloudflare-access" };
  }

  const chatGPTUser = await getChatGPTUser();
  return chatGPTUser ? { ...chatGPTUser, provider: "chatgpt" } : null;
}
