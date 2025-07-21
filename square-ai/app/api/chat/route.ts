import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAuthToken } from "@/lib/auth";
import { openai } from "@ai-sdk/openai";
import {
  convertToCoreMessages,
  streamText,
  UIMessage,
  generateId,
  generateText,
} from "ai";
import { fetchMutation } from "convex/nextjs";
import { revalidatePath } from "next/cache";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

async function generateChatTitle(messages: UIMessage[]) {
  try {
    // Take first 2-3 exchanges to generate a relevant title
    const relevantMessages = messages.slice(0, 6); // First 3 exchanges max

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: `Generate a concise, descriptive title (max 50 characters) for this conversation based on the main topic or question being discussed. The title should be specific and informative, not generic. Examples:
- "React useEffect cleanup functions"
- "Planning a trip to Japan"
- "Debugging TypeScript errors"
- "Healthy meal prep ideas"

Only return the title, nothing else.`,
        },
        ...convertToCoreMessages(relevantMessages),
      ],
      maxTokens: 20,
    });

    return result.text.replace(/['"]/g, "").trim();
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Chat";
  }
}

export async function POST(req: Request) {
  const {
    messages,
    currentChatId,
  }: { messages: UIMessage[]; currentChatId: Id<"chats"> | null } =
    await req.json();
  const token = await getAuthToken();

  const chatId =
    currentChatId ??
    (await fetchMutation(api.chats.create, { title: "New Chat" }, { token }));

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
      // save AI message
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

      // generate new title
      if (messages.length <= 2) {
        // First exchange (user + AI)
        const allMessages = [
          ...messages,
          {
            id: message.response.id,
            role: "assistant" as const,
            content: message.text,
            parts: [],
          } satisfies UIMessage,
        ];

        const newTitle = await generateChatTitle(allMessages);

        await fetchMutation(
          api.chats.updateTitle,
          {
            chatId: chatId as Id<"chats">,
            title: newTitle,
          },
          { token },
        );

        revalidatePath(`/chat/${chatId}`);
      }
    },
  });

  const response = result.toDataStreamResponse();
  response.headers.set("x-chat-id", chatId as string);
  return response;
}
