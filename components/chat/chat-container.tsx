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

export function ChatContainer({
  conversationId,
  initialMessages = [],
}: ChatContainerProps): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const lastMessage = initialMessages[initialMessages.length - 1];
  const [isLoading, setIsLoading] = useState(
    lastMessage?.role === "user" ||
      (lastMessage?.role === "assistant" && lastMessage.content === "")
  );
  const streamSourceRef = useRef<EventSource | null>(null);
  const eventsSourceRef = useRef<EventSource | null>(null);
  const joinedStreamRef = useRef<string | null>(null);

  const closeStreamSource = useCallback(() => {
    if (streamSourceRef.current) {
      streamSourceRef.current.close();
      streamSourceRef.current = null;
      joinedStreamRef.current = null;
    }
  }, []);

  const closeEventsSource = useCallback(() => {
    if (eventsSourceRef.current) {
      eventsSourceRef.current.close();
      eventsSourceRef.current = null;
    }
  }, []);

  const connectToStream = useCallback(
    (streamId: string, assistantMessageId?: string, lastEventId?: string) => {
      closeStreamSource();

      const url = new URL(`/api/stream/${streamId}`, window.location.origin);
      if (lastEventId) {
        url.searchParams.set("lastEventId", lastEventId);
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
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMsg,
                  content: lastMsg.content + chunk.data,
                },
              ];
            }
            return [
              ...prev,
              {
                id: assistantMessageId ?? crypto.randomUUID(),
                role: "assistant",
                content: chunk.data,
                createdAt: new Date().toISOString(),
              },
            ];
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
          joinedStreamRef.current = streamId;
          setIsLoading(true);
          fetch(`/api/conversations/${conversationId}/messages`)
            .then((res) => res.json())
            .then((result: { messages: ChatMessage[] }) => {
              setMessages([
                ...result.messages,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: "",
                  createdAt: new Date().toISOString(),
                },
              ]);
              connectToStream(streamId);
            })
            .catch(() => {
              setIsLoading(false);
            });
        }
      } catch {
        console.error(`[Client] Failed to parse event:`, event.data);
      }
    };

    es.onerror = () => {
      console.error(`[Client] Events connection error for conversation ${conversationId}`);
    };
  }, [conversationId, connectToStream, closeEventsSource]);

  const checkActiveStream = useCallback(async () => {
    try {
      const messagesRes = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!messagesRes.ok) return;
      const messagesData = (await messagesRes.json()) as { messages: ChatMessage[] };
      setMessages(messagesData.messages);

      const lastMsg = messagesData.messages[messagesData.messages.length - 1];

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
          joinedStreamRef.current = streamId;

          setMessages([
            ...messagesData.messages,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: "",
              createdAt: new Date().toISOString(),
            },
          ]);
          connectToStream(streamId);
        } else {
          const refreshRes = await fetch(`/api/conversations/${conversationId}/messages`);
          if (refreshRes.ok) {
            const refreshData = (await refreshRes.json()) as { messages: ChatMessage[] };
            setMessages(refreshData.messages);
          }
          setIsLoading(false);
        }
      }
    } catch {
      console.error(`[Client] Failed to check active stream for conversation ${conversationId}`);
    }
  }, [conversationId, connectToStream]);

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

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
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
        joinedStreamRef.current = data.streamId;
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
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
