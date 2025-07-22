"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger as DefaultSidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Pin, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NavUser } from "./nav-user";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { deleteChat, pinChat, unpinChat } from "@/lib/actions";

type SidebarProps = {
  user: Doc<"users">;
  chats: Doc<"chats">[];
};

export function AppSidebar({
  user,
  chats,
  ...props
}: React.ComponentProps<typeof Sidebar> & SidebarProps) {
  const router = useRouter();
  const pinnedChats = chats.filter((chat) => chat.isPinned);
  const restOfChats = chats.filter((chat) => !chat.isPinned);

  // TODO: add delete chat here

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#" className="transition-all duration-200">
                <div className="flex flex-col items-center gap-0.5 leading-none">
                  <span className="font-bold text-center text-2xl dark:text-white">
                    Square PHX AI
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Button
              variant="default"
              className="cursor-pointer w-full"
              // disabled={loading}
              onClick={() => router.push("/chat")}
            >
              {/* {loading && <LoaderCircle className="size-4 animate-spin" />} */}
              <span className="text-sm">New Chat</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {pinnedChats.length !== 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Pinned</SidebarGroupLabel>
            <SidebarMenu>
              {pinnedChats
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((chat) => (
                  <ChatListItem key={chat._id} chat={chat} />
                ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>All</SidebarGroupLabel>
          <SidebarMenu>
            {restOfChats
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((chat) => (
                <ChatListItem key={chat._id} chat={chat} />
              ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            avatar: user.imageUrl,
            isAdmin: user.isAdmin,
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export function SidebarTrigger() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DefaultSidebarTrigger className="cursor-pointer" />
      </TooltipTrigger>
      <TooltipContent>
        <p>⌘B</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function ChatListItem({ chat }: { chat: Doc<"chats"> }) {
  const { chatId } = useParams<{ chatId?: string }>();

  const handlePinMessage = async () => {
    if (chat.isPinned) await unpinChat(chatId as Id<"chats">);
    else await pinChat(chatId as Id<"chats">);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={chatId && chatId === chat._id ? true : false}
      >
        <div className="group/item flex w-full items-center justify-start overflow-hidden cursor-pointer">
          <Link
            href={`/chat/${chat._id}`}
            className="truncate duration-200 flex-grow text-primary-foreground"
          >
            {chat.title}
          </Link>

          <Pin
            className="size-5 flex-shrink-0 opacity-0 translate-x-5 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300 ease-in-out cursor-pointer hover:text-black dark:hover:text-gray-300"
            onClick={() => handlePinMessage()}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <X className="size-5 flex-shrink-0 opacity-0 translate-x-5 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300 ease-in-out cursor-pointer hover:text-black dark:hover:text-gray-300" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this chat and all of the messages.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteChat(chatId as Id<"chats">)}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
