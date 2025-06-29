"use client";

import { useChatContext } from "@/contexts/chat";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";

export function ChatInterface() {
  const { input, attachments } = useChatContext();
  const isInputEmpty = input === "" && attachments.length === 0;

  return (
    <>
      {isInputEmpty ? (
        <main className="flex-grow flex flex-col items-center justify-center w-full">
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-700 dark:text-gray-200">
              Ask away!
            </p>
            <p className="mt-2 text-gray-400">
              I&apos;m here to help you with anything.
            </p>
          </div>
        </main>
      ) : (
        <main className="flex-grow flex flex-col w-full overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="min-h-full flex flex-col justify-end p-4">
              <ChatMessages />
            </div>
          </div>
        </main>
      )}

      {/* Chat Input at the bottom */}
      <footer className="w-full flex-shrink-0 flex justify-center p-4">
        <ChatInput />
      </footer>
    </>
  );
}
