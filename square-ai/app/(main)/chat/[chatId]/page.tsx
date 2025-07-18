import { SidebarTrigger } from "@/components/app-sidebar";
import { WithSidebarLayout } from "@/components/with-sidebar";
import { ModeToggle } from "@/components/theme-toggle";
import { ChatInterface } from "@/components/chat-interface";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function IndividualChatPage({
  params,
}: {
  params: Promise<{ chatId: Id<"chats"> }>;
}) {
  const token = await getAuthToken();
  const { chatId } = await params;
  const messages = await fetchQuery(
    api.messages.getAllByChatId,
    { chatId },
    { token },
  );
  if (!messages) redirect("/chat");

  return (
    <WithSidebarLayout>
      <div className="flex h-screen">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between w-full flex-shrink-0 p-4">
            <SidebarTrigger />

            <div className="flex items-center space-x-4">
              <ModeToggle />
            </div>
          </header>

          <ChatInterface initialMessages={messages} chatId={chatId} />
        </div>
      </div>
    </WithSidebarLayout>
  );
}
