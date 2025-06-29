"use client";

import React, {
  createContext,
  Dispatch,
  SetStateAction,
  use,
  useState,
} from "react";

type ChatContextType = {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  attachments: File[];
  setAttachments: Dispatch<SetStateAction<File[]>>;
};

export const ChatContext = createContext<ChatContextType | null>(null);

export function ChatContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  return (
    <ChatContext.Provider
      value={{ input, setInput, attachments, setAttachments }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChatContext = () => {
  return use(ChatContext) as ChatContextType;
};
