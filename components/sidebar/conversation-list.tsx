"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "@/types";

async function fetchConversations(): Promise<ConversationListItem[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/conversations`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { conversations: ConversationListItem[] };
    return data.conversations ?? [];
  } catch {
    return [];
  }
}

interface ConversationListProps {
  activeConversationId?: string;
  isCollapsed?: boolean;
}

export function ConversationList({
  activeConversationId,
  isCollapsed = false,
}: ConversationListProps): React.JSX.Element {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    startTransition(() => {
      fetchConversations().then((data) => {
        setConversations(data);
        setHasLoaded(true);
      });
    });
  }, []);

  if (!hasLoaded || isPending) {
    return (
      <div className="flex-1 space-y-2 px-3 py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-full animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p
          className={cn(
            "text-sm text-muted-foreground transition-opacity duration-300",
            isCollapsed && "opacity-0 hidden lg:hidden"
          )}
        >
          No conversations yet.
        </p>
      </div>
    );
  }

  return (
    <nav className="flex-1 overflow-auto px-2 py-2">
      <ul className="space-y-1">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          return (
            <li key={conversation.id}>
              <Link
                href={`/${conversation.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
                title={conversation.title}
              >
                <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                <span
                  className={cn(
                    "truncate transition-[opacity,transform] ease-in-out duration-300",
                    isCollapsed
                      ? "opacity-0 -translate-x-2 hidden lg:hidden"
                      : "opacity-100 translate-x-0"
                  )}
                >
                  {conversation.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
