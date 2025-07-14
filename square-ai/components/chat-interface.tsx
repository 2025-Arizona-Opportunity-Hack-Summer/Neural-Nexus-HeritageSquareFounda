"use client";

import React, {
  useRef,
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useState,
} from "react";
import {
  Paperclip,
  ArrowUp,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePreview } from "./file-preview";
import { Doc, Id } from "@/convex/_generated/dataModel";

export function ChatInterface({
  initialMessages,
  chatId,
}: {
  initialMessages?: Doc<"messages">[];
  chatId?: Id<"chats">;
}) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<Doc<"messages">[]>(
    chatId && initialMessages ? initialMessages : [],
  );
  const [currentChatId] = useState(chatId);

  const addMessage = (message: Doc<"messages">) => {
    setMessages((prev) => [...prev, message]);
  };

  // const updateMessage = (
  //   messageId: string,
  //   updates: Partial<Doc<"messages">>,
  // ) => {
  //   setMessages((prev) =>
  //     prev.map((msg) => (msg._id === messageId ? { ...msg, ...updates } : msg)),
  //   );
  // };

  // Handles auto-resizing the textarea height based on content.
  const handleTextareaInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  // Handles file selection.
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const newAttachments = [...attachments, ...files].slice(0, 5); // Limit to 5 files
    setAttachments(newAttachments);

    // Reset file input to allow selecting the same file again
    if (e.target) e.target.value = "";
  };

  // Triggers the hidden file input.
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Removes a file from the attachments list.
  const removeAttachment = (indexToRemove: number) => {
    setAttachments(attachments.filter((_, index) => index !== indexToRemove));
  };

  // Handles the form submission.
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() || attachments.length > 0) {
      const formData = new FormData();
      formData.append("message", input);
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      console.log("Submitting:", {
        message: input,
        files: attachments.map((f) => f.name),
      });

      setInput("");
      setAttachments([]);

      // FIXME: optimisitic update
      // const newMsgObj: ExampleMessage = {
      //   content: input,
      //   id: "3322",
      //   role: "user",
      // };
      // setMessages([...messages, newMsgObj]);

      const tempMessageChatId = currentChatId
        ? currentChatId
        : (`temp-chat-id-${Date.now()}` as Id<"chats">);

      const tempUserMessageId = `temp-msg-id-${Date.now()}` as Id<"messages">;
      const tempUserMessage: Doc<"messages"> = {
        _creationTime: Date.now(),
        _id: tempUserMessageId,
        chatId: tempMessageChatId,
        content: input,
        sender: "user",
        isPending: false,
        createdAt: Date.now(),
      };

      addMessage(tempUserMessage);

      if (!currentChatId) {
        window.history.pushState(null, "", `/chat/${tempMessageChatId}`);
      }

      const tempAiMessageId = `temp-msg-id-${Date.now()}` as Id<"messages">;
      const tempAiMessage: Doc<"messages"> = {
        _creationTime: Date.now(),
        _id: tempAiMessageId,
        chatId: tempMessageChatId,
        content: "",
        sender: "ai",
        isPending: true,
        createdAt: Date.now(),
      };

      addMessage(tempAiMessage);

      if (textareaRef.current) {
        textareaRef.current.style.height = "24px";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // We need to manually trigger form submission as we prevented default.
      // A direct call to handleSubmit needs a form event, so we'll trigger the form's submit event.
      if (!isSubmitDisabled && e.currentTarget.form) {
        e.currentTarget.form.requestSubmit();
      }
    }
  };

  const isSubmitDisabled = !input.trim() && attachments.length === 0;
  const isInputEmpty = input === "" && attachments.length === 0;

  return (
    <>
      <main className="flex-grow flex flex-col items-center justify-center w-full">
        {messages.length !== 0 ? (
          <ChatMessages messages={messages} />
        ) : isInputEmpty ? (
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
            onSubmit={handleSubmit}
            className="bg-card/90 backdrop-blur-sm rounded-3xl border border-border shadow-lg p-4 transition-all duration-300 hover:shadow-xl"
          >
            <div className="space-y-3">
              {attachments.length > 0 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {attachments.map((file, index) => (
                    <FilePreview
                      key={`${file.name}-${index}`}
                      file={file}
                      onRemove={() => removeAttachment(index)}
                    />
                  ))}
                </div>
              )}

              <div className="w-full">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  rows={1}
                  className="w-full bg-transparent text-foreground placeholder-muted-foreground text-base focus:outline-none focus:ring-0 border-0 p-0 resize-none overflow-y-auto font-sans"
                  style={{ minHeight: "24px", height: "24px" }}
                  onInput={handleTextareaInput}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={triggerFileSelect}
                    className="w-8 h-8 cursor-pointer rounded-lg text-muted-foreground hover:bg-accent transition-all duration-200 flex items-center justify-center"
                    aria-label="Add attachment"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  size="icon"
                  className={`w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center ${
                    !isSubmitDisabled
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-md hover:shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                  disabled={isSubmitDisabled}
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

// Use for later
export function ChatMessages({ messages }: { messages: Doc<"messages">[] }) {
  return (
    <main className="flex-grow flex flex-col w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col justify-end p-4">
          <div className="flex flex-col space-y-4 max-w-3xl mx-auto w-full">
            {messages.map((message) => (
              <div key={message._id} className="w-full">
                {message.sender === "user" ? (
                  // User message - always aligned to the right
                  <div className="flex justify-end">
                    <div className="flex flex-col max-w-[80%]">
                      <div className="rounded-2xl px-4 py-3 bg-primary text-primary-foreground">
                        <p className="leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // AI message - always aligned to the left
                  <div className="flex justify-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        {message.isPending ? (
                          <LoaderCircle className="w-4 h-4 text-primary-foreground animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col max-w-[80%]">
                      {message.isPending ? (
                        <div className="mt-1 text-foreground">
                          <p className="leading-relaxed">Just a second...</p>
                        </div>
                      ) : (
                        <>
                          <div className="rounded-2xl px-4 py-3 bg-muted text-foreground">
                            <p className="leading-relaxed">{message.content}</p>
                          </div>
                          <div className="flex items-center space-x-1 mt-2 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
