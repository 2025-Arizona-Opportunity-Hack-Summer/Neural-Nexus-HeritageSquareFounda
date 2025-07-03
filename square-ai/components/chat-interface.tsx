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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePreview } from "./file-preview";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sample messages - in a real app this would come from context or props
  const messages: Message[] = [
    {
      id: "1",
      role: "user",
      content: "can you turn it into fahrenheit",
    },
    {
      id: "2",
      role: "assistant",
      content:
        "The current temperature in Phoenix, Arizona is approximately 102.74°F. Is there anything else you'd like to know or any other way I can assist you?",
    },
  ];

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
              <div className="flex flex-col space-y-4 max-w-3xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col max-w-[80%]">
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="leading-relaxed">{message.content}</p>
                      </div>
                      {message.role === "assistant" && (
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
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}
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
