"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, Trash2 } from "lucide-react";
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

async function deleteConversation(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
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
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadConversations = () => {
    startTransition(() => {
      fetchConversations().then((data) => {
        setConversations(data);
        setHasLoaded(true);
      });
    });
  };

  useEffect(() => {
    loadConversations();
  }, [pathname]);

  useEffect(() => {
    const handleUpdate = () => loadConversations();
    window.addEventListener("conversation:updated", handleUpdate);
    return () => window.removeEventListener("conversation:updated", handleUpdate);
  }, []);

  const handleDelete = async (conversation: ConversationListItem) => {
    const confirmed = window.confirm(
      `Delete "${conversation.title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    const wasActive = conversation.id === activeConversationId;

    setConversations((prev) => prev.filter((c) => c.id !== conversation.id));

    const success = await deleteConversation(conversation.id);

    if (!success) {
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversation.id);
        if (exists) return prev;
        return [...prev, conversation].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
      return;
    }

    if (wasActive) {
      router.push("/");
    }
  };

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
            <li key={conversation.id} className="group">
              <div
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Link
                  href={`/${conversation.id}`}
                  className="flex flex-1 items-center gap-2 overflow-hidden"
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
                {!isCollapsed && (
                  <button
                    onClick={() => handleDelete(conversation)}
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-opacity hover:bg-destructive/10 hover:text-destructive",
                      isActive
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    )}
                    aria-label={`Delete ${conversation.title}`}
                    title="Delete conversation"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
