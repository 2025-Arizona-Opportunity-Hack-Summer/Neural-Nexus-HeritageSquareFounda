import { SidebarTrigger } from "@/components/app-sidebar";
import { WithSidebarLayout } from "@/components/with-sidebar";
import { ModeToggle } from "@/components/theme-toggle";
import { ChatInterface } from "@/components/chat-interface";

export default async function NewChatPage() {
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

          <ChatInterface />
        </div>
      </div>
    </WithSidebarLayout>
  );
}
