"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import type { ChatMessage, ChatRequest, StreamInitResponse } from "@/types";

interface ChatContainerProps {
  conversationId: string;
  initialMessages?: ChatMessage[];
}

function createAssistantPlaceholder(id = crypto.randomUUID()): ChatMessage {
  return {
    id,
    role: "assistant",
    content: "",
    createdAt: new Date().toISOString(),
  };
}

function preferAssistantMessage(
  current: ChatMessage,
  next: ChatMessage
): ChatMessage {
  if (!current.content) return next;
  if (!next.content) return current;
  if (next.content.startsWith(current.content)) return next;
  if (current.content.startsWith(next.content)) return current;
  return current.createdAt >= next.createdAt ? current : next;
}

function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
  const normalized: ChatMessage[] = [];

  for (const message of messages) {
    const lastMessage = normalized[normalized.length - 1];

    if (lastMessage?.role === "assistant" && message.role === "assistant") {
      normalized[normalized.length - 1] = preferAssistantMessage(
        lastMessage,
        message
      );
      continue;
    }

    normalized.push(message);
  }

  return normalized;
}

function withAssistantPlaceholder(
  messages: ChatMessage[],
  assistantMessageId?: string
): ChatMessage[] {
  const normalized = normalizeMessages(messages);
  const lastMessage = normalized[normalized.length - 1];

  if (lastMessage?.role === "assistant") {
    return normalized;
  }

  return [
    ...normalized,
    createAssistantPlaceholder(assistantMessageId),
  ];
}

export function ChatContainer({
  conversationId,
  initialMessages = [],
}: ChatContainerProps): React.JSX.Element {
  const normalizedInitialMessages = normalizeMessages(initialMessages);
  const [messages, setMessages] = useState<ChatMessage[]>(normalizedInitialMessages);
  const lastMessage =
    normalizedInitialMessages[normalizedInitialMessages.length - 1];
  const [isLoading, setIsLoading] = useState(
    lastMessage?.role === "user" ||
      (lastMessage?.role === "assistant" && lastMessage.content === "")
  );
  const streamSourceRef = useRef<EventSource | null>(null);
  const eventsSourceRef = useRef<EventSource | null>(null);
  const joinedStreamRef = useRef<string | null>(null);
  const assistantMessageIdRef = useRef<string | null>(null);
  const lastChunkIdRef = useRef<number>(-1);

  const closeStreamSource = useCallback(() => {
    if (streamSourceRef.current) {
      streamSourceRef.current.close();
      streamSourceRef.current = null;
    }
    joinedStreamRef.current = null;
    assistantMessageIdRef.current = null;
    lastChunkIdRef.current = -1;
  }, []);

  const closeEventsSource = useCallback(() => {
    if (eventsSourceRef.current) {
      eventsSourceRef.current.close();
      eventsSourceRef.current = null;
    }
  }, []);

  const syncMessagesFromServer = useCallback(async (): Promise<ChatMessage[]> => {
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    if (!res.ok) {
      throw new Error("Failed to fetch messages");
    }

    const data = (await res.json()) as { messages: ChatMessage[] };
    const nextMessages = normalizeMessages(data.messages);
    setMessages(nextMessages);
    return nextMessages;
  }, [conversationId]);

  const connectToStream = useCallback(
    (streamId: string, assistantMessageId?: string, lastEventId?: string) => {
      if (assistantMessageId) {
        assistantMessageIdRef.current = assistantMessageId;
      }

      if (streamSourceRef.current && joinedStreamRef.current === streamId) {
        return;
      }

      const resumeFromEventId =
        lastEventId ??
        (joinedStreamRef.current === streamId && lastChunkIdRef.current >= 0
          ? String(lastChunkIdRef.current)
          : undefined);

      closeStreamSource();
      joinedStreamRef.current = streamId;

      const url = new URL(`/api/stream/${streamId}`, window.location.origin);
      if (resumeFromEventId) {
        url.searchParams.set("lastEventId", resumeFromEventId);
      }

      const es = new EventSource(url.toString());
      streamSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const chunk = JSON.parse(event.data) as {
            id: number;
            data: string;
            done: boolean;
          };

          if (chunk.id <= lastChunkIdRef.current && !chunk.done) {
            return;
          }

          if (chunk.id > lastChunkIdRef.current) {
            lastChunkIdRef.current = chunk.id;
          }

          if (chunk.done) {
            closeStreamSource();
            setIsLoading(false);
            joinedStreamRef.current = null;
            window.dispatchEvent(new CustomEvent("conversation:updated"));
            return;
          }

          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === "assistant") {
              return normalizeMessages([
                ...prev.slice(0, -1),
                {
                  ...lastMsg,
                  content: lastMsg.content + chunk.data,
                },
              ]);
            }
            return normalizeMessages([
              ...prev,
              {
                id:
                  assistantMessageIdRef.current ??
                  assistantMessageId ??
                  crypto.randomUUID(),
                role: "assistant",
                content: chunk.data,
                createdAt: new Date().toISOString(),
              },
            ]);
          });
        } catch {
          console.error(`[Client] Failed to parse event:`, event.data);
        }
      };

      es.onerror = () => {
        es.close();
        streamSourceRef.current = null;
        joinedStreamRef.current = null;
      };
    },
    [closeStreamSource]
  );

  const subscribeToConversationEvents = useCallback(() => {
    closeEventsSource();

    const url = new URL(
      `/api/conversations/${conversationId}/events`,
      window.location.origin
    );

    const es = new EventSource(url.toString());
    eventsSourceRef.current = es;

    es.onopen = () => {
      console.log(`[Client] Events connection opened for conversation ${conversationId}`);
    };

    es.onerror = (error) => {
      console.error(`[Client] Events connection error:`, error);
    };

    es.onmessage = (event) => {
      console.log(`[Client] Received event:`, event.data);
      try {
        const data = JSON.parse(event.data) as {
          type: string;
          streamId: string;
          conversationId: string;
        };

        console.log(`[Client] Parsed event:`, data);

        if (data.type === "stream-started" && data.streamId) {
          const streamId = data.streamId;
          if (joinedStreamRef.current === streamId) {
            console.log(`[Client] Ignoring stream-started event for already-joined stream ${streamId}`);
            return;
          }
          setIsLoading(true);
          fetch(`/api/conversations/${conversationId}/messages`)
            .then((res) => res.json())
            .then((result: { messages: ChatMessage[] }) => {
              setMessages(withAssistantPlaceholder(result.messages));
              connectToStream(streamId);
            })
            .catch(() => {
              setIsLoading(false);
            });
          return;
        }

        if (data.type === "stream-ended" && data.streamId) {
          if (joinedStreamRef.current === data.streamId) {
            closeStreamSource();
          }

          void syncMessagesFromServer()
            .catch(() => {
              console.error(
                `[Client] Failed to sync messages for conversation ${conversationId}`
              );
            })
            .finally(() => {
              setIsLoading(false);
              joinedStreamRef.current = null;
              window.dispatchEvent(new CustomEvent("conversation:updated"));
            });
        }
      } catch {
        console.error(`[Client] Failed to parse event:`, event.data);
      }
    };

    es.onerror = () => {
      console.error(`[Client] Events connection error for conversation ${conversationId}`);
    };
  }, [
    closeEventsSource,
    closeStreamSource,
    connectToStream,
    conversationId,
    syncMessagesFromServer,
  ]);

  const checkActiveStream = useCallback(async () => {
    try {
      const messagesData = await syncMessagesFromServer();

      const lastMsg = messagesData[messagesData.length - 1];

      if (lastMsg?.role === "assistant") {
        setIsLoading(false);
        return;
      }

      if (lastMsg?.role === "user") {
        setIsLoading(true);

        const res = await fetch(`/api/conversations/${conversationId}/active-stream`);
        if (!res.ok) return;
        const data = (await res.json()) as { active: boolean; streamId?: string };

        if (data.active && data.streamId) {
          const streamId = data.streamId;
          if (joinedStreamRef.current === streamId) return;

          setMessages(withAssistantPlaceholder(messagesData));
          connectToStream(streamId);
        } else {
          await syncMessagesFromServer().catch(() => undefined);
          setIsLoading(false);
        }
      }
    } catch {
      console.error(`[Client] Failed to check active stream for conversation ${conversationId}`);
    }
  }, [conversationId, connectToStream, syncMessagesFromServer]);

  const handleSend = useCallback(
    async (content: string) => {
      closeStreamSource();

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) =>
        normalizeMessages([...prev, userMessage, assistantMessage])
      );
      setIsLoading(true);

      try {
        const payload: ChatRequest = {
          message: content,
          conversationId,
        };

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("Failed to send message");
        }

        const data = (await res.json()) as StreamInitResponse;
        connectToStream(data.streamId, assistantMessageId);
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
        setIsLoading(false);
        joinedStreamRef.current = null;
      }
    },
    [conversationId, connectToStream, closeStreamSource]
  );

  useEffect(() => {
    subscribeToConversationEvents();

    return () => {
      closeStreamSource();
      closeEventsSource();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkActiveStream();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MessageList messages={messages} />
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
