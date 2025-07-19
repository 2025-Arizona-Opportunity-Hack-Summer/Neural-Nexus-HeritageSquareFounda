import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAuthToken } from "@/lib/auth";
import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText, UIMessage, generateId } from "ai";
import { fetchMutation } from "convex/nextjs";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    currentChatId,
  }: { messages: UIMessage[]; currentChatId: Id<"chats"> | null } =
    await req.json();
  const token = await getAuthToken();

  const chatId =
    currentChatId ??
    (await fetchMutation(api.chats.create, { title: "Bangss" }, { token }));

  // add user message into database
  const userMessage = messages[messages.length - 1];
  console.log(userMessage);
  if (userMessage.role === "user") {
    await fetchMutation(
      api.messages.create,
      {
        chatId: chatId as Id<"chats">,
        content: userMessage.content,
        parts: [],
        uiId: generateId(),
        role: "user",
        createdAt: Date.now(),
      },
      { token },
    );
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: convertToCoreMessages(messages),
    onFinish: async (message) => {
      await fetchMutation(
        api.messages.create,
        {
          chatId: chatId as Id<"chats">,
          content: message.text,
          parts: [],
          uiId: message.response.id,
          role: "assistant",
          createdAt: Date.now(),
        },
        { token },
      );
    },
  });

  const response = result.toDataStreamResponse();
  response.headers.set("x-chat-id", chatId as string);
  return response;
}
