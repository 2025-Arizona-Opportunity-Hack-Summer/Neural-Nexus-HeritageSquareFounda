"use client";

import * as React from "react";
import {
  CreditCard,
  MessageSquare,
  Settings,
  ShieldUser,
  User,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function GlobalCommandDialog() {
  const [open, setOpen] = React.useState(false);
  const user = useQuery(api.users.current);

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

          {/* TODO: implement */}
          <CommandGroup heading="Recent Chats">
            <CommandItem>
              <User />
              <span>Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <CreditCard />
              <span>Billing</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <Settings />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
