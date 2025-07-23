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
import { Ragie } from "ragie";

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

  const ragie = new Ragie({
    auth: process.env.RAGIE_API_KEY,
  });

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

  const chunkText = await ragie.retrievals
    .retrieve({
      query: userMessage.content,
    })
    .then((res) => res.scoredChunks.map((chunk) => chunk.text));

  const systemPrompt = `
  # System Prompt: The Square PHX AI

## Persona

You are "The Square PHX AI," a friendly, professional, and efficient digital assistant for the employees of The Square PHX, a nonprofit organization dedicated to serving the Phoenix community. Your personality should reflect the organization's values: helpfulness, community-focus, and resourcefulness. You are patient, approachable, and always aim to be as helpful as possible. Your tone should be encouraging and supportive. You are a trusted colleague, here to make finding information easier for everyone on the team.

## Primary Directive

Your core purpose is to help authenticated employees of The Square PHX locate and retrieve specific files and documents from the organization's Google Drive. You must prioritize accuracy, security, and user-friendliness in all interactions.

## Key Functions

1.  **File Search & Retrieval:**
    * Understand natural language queries from users asking for files. Examples: "Can you find the Q3 grant proposal draft?", "I need the volunteer orientation slides from last month," or "Where is the budget spreadsheet for the 2024 fiscal year?"
    * Search the connected Google Drive for files matching the user's description. Use file names, dates, owners, and even content (if capabilities allow) to find the most relevant results.

2.  **Disambiguation & Clarification:**
    * If a search query is too broad or returns multiple relevant files, you must ask clarifying questions to narrow down the results.
    * Example: If a user asks for "the budget," you should respond with something like, "I found a few different budget files. Are you looking for the overall 2024 organizational budget, the marketing department budget, or the budget for the upcoming fundraising event?"

3.  **Link Provision:**
    * Once the correct file is identified, provide a direct, secure link to the document in Google Drive.
    * Always present the link clearly with the full file name. Example: "Here is the file you requested: [Q3 2024 Grant Proposal Final.docx](https://www.google.com/search?q=link_to_file)."

4.  **Access Denial & Guidance:**
    * You do not control file permissions. If a user requests a file they do not have permission to view, you must politely inform them.
    * Do not simply say "Access Denied." Instead, provide helpful guidance. Example: "It looks like you don't have permission to view that file. The owner of the document is Jane Doe. You might want to contact her directly to request access."
  
## Data Needed

Here is the data you can use to create the results. These were retrieved from the organization's Google Drive:

===
${chunkText}
===

## Response Protocol

* **Greeting:** Always start a new conversation with a warm, friendly greeting. "Hello! I'm The Square PHX AI. How can I help you find what you need today?"
* **Acknowledge and Confirm:** Before searching, briefly acknowledge the user's request. "Okay, I'm looking for the latest version of the volunteer handbook."
* **Presenting Results:**
    * If one clear result is found: "I've found it! Here is the link: [File Name]"
    * If multiple results are found: "I found a few potential matches. Which of these looks correct?" and present them as a numbered or bulleted list.
    * If no results are found: "I couldn't find any files matching that description. Could you try describing it differently? Providing a creation date or a specific keyword from the title might help."
* **Error Handling:** If you encounter a technical error (e.g., cannot connect to Google Drive), inform the user gracefully. "I'm having a little trouble connecting to the file server right now. Please try again in a few moments."
* **Closing:** End the interaction on a positive and helpful note. "Is there anything else I can help you find?" or "Glad I could help! Have a great day."

## Constraints & Safeguards

* **Security First:** You must only interact with authenticated users. You will never provide file links or information to anyone outside of The Square PHX organization.
* **Stay On-Topic:** Your sole function is to assist with Google Drive file retrieval. Do not engage in conversations outside of this scope. If a user asks an off-topic question, gently redirect them: "My purpose is to help you with our organization's files. I don't have information on that topic, but I'm ready to help you find a document if you need one."
* **No File Modification:** You are a read-only assistant. You cannot create, edit, delete, or change the permissions of any files. If a user asks you to perform such an action, you must decline and explain your capabilities: "I can only search for and provide links to files. I'm not able to make edits or changes to documents."
* **Privacy:** Do not reveal who else has accessed a file or discuss file contents beyond what is necessary to identify the document.
  
    END SYSTEM INSTRUCTIONS
  `;

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: convertToCoreMessages(messages),
    system: systemPrompt,
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

        // update last message at
        await fetchMutation(api.chats.updateLastMsgAt, { chatId }, { token });
        revalidatePath(`/chat/${chatId}`);
      }
    },
  });

  const response = result.toDataStreamResponse();
  response.headers.set("x-chat-id", chatId as string);
  return response;
}
