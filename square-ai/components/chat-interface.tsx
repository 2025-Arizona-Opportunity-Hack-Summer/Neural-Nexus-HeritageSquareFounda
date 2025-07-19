"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Copy, Sparkles } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { UIMessage } from "ai";
import { FormEvent, useState } from "react";

export function ChatInterface({
  chatId,
  initialMessages,
}: {
  chatId?: Id<"chats">;
  initialMessages?: UIMessage[];
}) {
  const [currentChatId, setCurrentChatId] = useState(chatId ? chatId : null);
  const [hasNavigated, setHasNavigated] = useState(false);
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleChatSubmit,
  } = useChat({
    api: "/api/chat",
    initialMessages: initialMessages ? initialMessages : [],
    body: {
      currentChatId,
    },
    onResponse: (response) => {
      const newChatId = response.headers.get("x-chat-id");
      if (newChatId && !hasNavigated && !chatId) {
        setCurrentChatId(newChatId as Id<"chats">);
        window.history.pushState(null, "", `/chat/${newChatId}`);
        setHasNavigated(true);
      }
    },
  });
  console.log(currentChatId);

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    handleChatSubmit(e);
  };

  return (
    <>
      <main className="flex-grow flex flex-col items-center justify-center w-full">
        {messages.length !== 0 ? (
          <div className="flex-grow flex flex-col w-full overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="min-h-full flex flex-col justify-end p-4">
                <div className="flex flex-col space-y-4 max-w-3xl mx-auto w-full">
                  {messages.map((message) => (
                    <div key={message.id} className="w-full">
                      {message.role === "user" ? (
                        // User message - always aligned to the right
                        <div className="flex justify-end">
                          <div className="flex flex-col max-w-[80%]">
                            <div className="rounded-2xl px-4 py-3 bg-primary text-primary-foreground">
                              <p className="leading-relaxed">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // AI message - always aligned to the left
                        <div className="flex justify-start">
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-primary-foreground" />
                            </div>
                          </div>
                          <div className="flex flex-col max-w-[80%]">
                            <div className="rounded-2xl px-4 py-3 bg-muted text-foreground">
                              <p className="leading-relaxed">
                                {message.content}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 mt-2 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : input === "" ? (
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-700 dark:text-gray-200">
              Ask away!
            </p>
            <p className="mt-2 text-gray-400">
              I&apos;m here to help you with anything.
            </p>
          </div>
        ) : (
          <div></div>
        )}
      </main>

      {/* Chat Input at the bottom */}
      <footer className="w-full flex-shrink-0 flex justify-center p-4">
        <div className="w-full max-w-3xl mx-auto">
          <form
            onSubmit={handleFormSubmit}
            className="bg-card/90 backdrop-blur-sm rounded-3xl border border-border shadow-lg p-4 transition-all duration-300 hover:shadow-xl"
          >
            <div className="space-y-3">
              <div className="w-full">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask anything..."
                  className="w-full bg-transparent text-foreground placeholder-muted-foreground text-base focus:outline-none focus:ring-0 border-0 p-0 resize-none overflow-y-auto font-sans"
                  style={{ minHeight: "24px", height: "24px" }}
                />
              </div>

              <div className="flex items-center justify-end">
                <Button
                  type="submit"
                  variant="default"
                  size="icon"
                  className={`w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center ${
                    !(input === "")
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-md hover:shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                  disabled={input === ""}
                  aria-label="Send message"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </footer>
    </>
  );
}
