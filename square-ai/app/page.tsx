import { SidebarTrigger } from "@/components/app-sidebar";
import { WithSidebarLayout } from "@/components/with-sidebar";
import { ChatInput } from "@/components/chat-input";
import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

export default function Home() {
  return (
    <WithSidebarLayout>
      <div className="flex h-screen">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between w-full flex-shrink-0 p-4">
            <SidebarTrigger />

            <div className="flex items-center space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                  >
                    <Link href="/settings">
                      <Settings2 />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>

              <ModeToggle />
            </div>
          </header>

          {/* What's up page */}

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

          {/* Chat Input at the bottom */}
          <footer className="w-full flex-shrink-0 flex justify-center p-4">
            <ChatInput />
          </footer>
        </div>
      </div>
    </WithSidebarLayout>
  );
}
