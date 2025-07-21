"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { Pin, X } from "lucide-react";
import Link from "next/link";

export function ChatList({
  preloadedChats,
}: {
  preloadedChats: Preloaded<typeof api.chats.getAllCurrentUser>;
}) {
  const chats = usePreloadedQuery(preloadedChats);

  return (
    <SidebarMenu>
      {chats.map((chat) => (
        <SidebarMenuItem key={chat.title}>
          <SidebarMenuButton asChild>
            <div className="group/item flex w-full items-center justify-start overflow-hidden cursor-pointer">
              <Link
                href={`/chat/${chat._id}`}
                className="truncate duration-200 flex-grow text-primary-foreground"
              >
                {chat.title}
              </Link>

              <Pin className="size-5 flex-shrink-0 opacity-0 translate-x-5 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300 ease-in-out cursor-pointer hover:text-black dark:hover:text-gray-300" />

              <X className="size-5 flex-shrink-0 opacity-0 translate-x-5 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300 ease-in-out cursor-pointer hover:text-black dark:hover:text-gray-300" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
