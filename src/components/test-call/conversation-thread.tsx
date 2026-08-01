import { Bot, User } from "lucide-react";

import type { ConversationMessage } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

function TypingIndicator() {
  return (
    <li className="flex justify-start">
      <div className="flex max-w-[80%] items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
        <Bot className="size-4 shrink-0 opacity-70" />
        <span className="flex gap-1">
          <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60" />
        </span>
      </div>
    </li>
  );
}

export function ConversationThread({
  conversation,
  isAssistantTyping,
}: {
  conversation: ConversationMessage[];
  isAssistantTyping: boolean;
}) {
  if (conversation.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune conversation pour le moment.</p>;
  }

  return (
    <ul className="space-y-3">
      {conversation.map((turn, index) => (
        <li
          key={index}
          className={turn.role === "assistant" ? "flex justify-start" : "flex justify-end"}
        >
          <div
            className={cn(
              "flex max-w-[80%] items-start gap-2 rounded-lg px-3 py-2 text-sm",
              turn.role === "assistant"
                ? "bg-muted"
                : "flex-row-reverse bg-primary text-primary-foreground"
            )}
          >
            {turn.role === "assistant" ? (
              <Bot className="mt-0.5 size-4 shrink-0 opacity-70" />
            ) : (
              <User className="mt-0.5 size-4 shrink-0 opacity-70" />
            )}
            <div>
              <p className="mb-1 text-xs font-medium opacity-70">
                {turn.role === "assistant" ? "Assistant IA" : "Client (vous)"}
              </p>
              {turn.content}
            </div>
          </div>
        </li>
      ))}
      {isAssistantTyping && <TypingIndicator />}
    </ul>
  );
}
