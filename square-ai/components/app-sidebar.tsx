import * as React from "react";

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
  SidebarInset,
  SidebarProvider,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { LogIn, Pin, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

const newData = {
  chats: [
    { title: "Ancient civilization interest", url: "#" },
    { title: "Modern interests", url: "#" },
    {
      title:
        "Ancient civilization interestinterestinterestinterestinterestinterest",
      url: "#",
    },
    { title: "Ancient civilization interests", url: "#" },
  ],
};

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await currentUser();

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
            <Button variant="default" className="cursor-pointer w-full">
              <span className="text-sm">New Chat</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarMenu>
            {newData.chats.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <div className="group/item flex w-full items-center justify-start overflow-hidden cursor-pointer">
                    <a
                      href={item.url}
                      className="truncate duration-200 flex-grow text-primary-foreground"
                    >
                      {item.title}
                    </a>

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
        {user ? (
          <Link
            href="/settings"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "flex items-center justify-start gap-2 p-6 cursor-pointer",
            )}
          >
            <>
              <Avatar>
                <AvatarImage src={user.imageUrl} alt="User Avatar" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <span>{`${user.firstName} ${user.lastName}`}</span>
            </>
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "flex items-center justify-start p-6 cursor-pointer",
            )}
          >
            <>
              <LogIn className="size-4" />
              <span className="text-base ml-1">Login</span>
            </>
          </Link>
        )}

        {/* <SidebarAvatar /> */}
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

export function WithSidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
