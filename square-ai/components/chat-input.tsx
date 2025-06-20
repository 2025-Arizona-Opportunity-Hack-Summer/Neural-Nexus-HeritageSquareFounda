"use client";

import React, {
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
} from "react";
import { Paperclip, MoreHorizontal, ArrowUp, FileText, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  const isImage = file.type.startsWith("image/");

  return (
    <div className="relative inline-flex flex-col items-center justify-center bg-muted/50 rounded-xl border border-border p-2 text-foreground h-28 w-28 overflow-hidden shrink-0 transition-colors">
      {isImage ? (
        <Image
          src={URL.createObjectURL(file)}
          fill
          alt={file.name}
          className="h-full w-full object-cover rounded-md"
          onLoad={(e) =>
            URL.revokeObjectURL((e.target as HTMLImageElement).src)
          } // Clean up object URL
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center">
          <FileText className="w-8 h-8 text-muted-foreground" />
          <span className="text-xs mt-2 break-all w-full px-1 text-foreground">
            {file.name}
          </span>
        </div>
      )}
      <Button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 bg-background/80 hover:bg-muted/80 text-foreground rounded-full p-0.5 transition-all duration-200 border border-border/50"
        aria-label="Remove file"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};

export function ChatInput() {
  const [input, setInput] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-8 h-8 cursor-pointer rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-all duration-200 flex items-center justify-center"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>

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
                className="w-8 h-8 cursor-pointer rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-all duration-200 flex items-center justify-center"
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

      {/* <p className="text-center text-xs text-muted-foreground mt-3">
        This is a demo. Attachments are not actually uploaded.
      </p> */}
    </div>
  );
}
