import { notFound } from "next/navigation";
import { getChatGPTUser, requireChatGPTUser } from "./chatgpt-auth";

export const OWNER_EMAIL = "widaratnuch17@gmail.com";

export async function requireOwner(returnTo: string) {
  const user = await requireChatGPTUser(returnTo);
  if (user.email.toLowerCase() !== OWNER_EMAIL) notFound();
  return user;
}

export async function isOwner() {
  const user = await getChatGPTUser();
  return user?.email.toLowerCase() === OWNER_EMAIL;
}
