"use client";

import * as React from "react";
import { MessageSquare, ShieldUser } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function GlobalCommandDialog() {
  const [open, setOpen] = React.useState(false);
  const user = useQuery(api.users.current);
  const chats = useQuery(api.chats.getAllCurrentUser);
  console.log(chats);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search app..." />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>

          <CommandGroup heading="Pages">
            {user?.isAdmin && (
              <CommandItem>
                <ShieldUser />
                <span>Admin Panel</span>
              </CommandItem>
            )}

            <CommandItem>
              <MessageSquare />
              <span>Chat</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />

          <CommandGroup heading="Recent Chats">
            {chats?.map((chat) => (
              <CommandItem key={chat._id}>
                <span>{chat.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
