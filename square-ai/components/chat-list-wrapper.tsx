import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { ChatList } from "./chat-list";
import { getAuthToken } from "@/lib/auth";

export async function ChatListWrapper() {
  const token = await getAuthToken();

  const preloadedChats = await preloadQuery(
    api.chats.getAllCurrentUser,
    {},
    { token },
  );

  return <ChatList preloadedChats={preloadedChats} />;
}
