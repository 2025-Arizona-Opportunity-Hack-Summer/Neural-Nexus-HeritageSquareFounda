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
import { Button } from "@/components/ui/button";
import { Pin, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NavUser } from "./nav-user";
import { Doc } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
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
