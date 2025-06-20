"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { ChatInput } from "@/components/chat-input";
import { SidebarTrigger, WithSidebarLayout } from "@/components/app-sidebar";

export default function Home() {
  return (
    <WithSidebarLayout>
      <div className="flex h-screen">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between w-full flex-shrink-0 p-4">
            <SidebarTrigger />

            <Avatar>
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt="User Avatar"
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </header>

          {/* What's up page */}

          <main className="flex-grow flex flex-col items-center justify-center w-full">
            <div className="text-center">
              <p className="text-5xl font-bold text-gray-700">Ask away!</p>
              <p className="mt-2 text-gray-400">
                I&apos;m here to help you with anything.
              </p>
            </div>
          </main>

          {/* Chat Input at the bottom */}
          <footer className="w-full flex-shrink-0 flex justify-center p-4">
            {/* <ChatInput /> */}
          </footer>
        </div>
      </div>
    </WithSidebarLayout>
  );
}
