import { Copy, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

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

export function ChatMessages() {
  return (
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
