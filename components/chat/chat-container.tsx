"use client";

import { useState, useOptimistic, useCallback, useEffect, useRef, startTransition } from "react";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import type { ChatMessage, ChatRequest, ChatResponse } from "@/types";

interface ChatContainerProps {
  conversationId: string;
  initialMessages?: ChatMessage[];
  initialPrompt?: string;
}

export function ChatContainer({
  conversationId,
  initialMessages = [],
  initialPrompt,
}: ChatContainerProps): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const initialPromptRef = useRef(initialPrompt);

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: ChatMessage) => [...state, newMessage]
  );

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      startTransition(() => {
        addOptimisticMessage(userMessage);
      });
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

        const data = (await res.json()) as ChatResponse;

        const assistantMessage: ChatMessage = {
          id: data.messageId,
          role: "assistant",
          content: data.content,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);

        window.dispatchEvent(new CustomEvent("conversation:updated"));
      } catch (error) {
        console.error("Chat error:", error);
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, addOptimisticMessage]
  );

  useEffect(() => {
    const prompt = initialPromptRef.current;
    if (prompt) {
      handleSend(prompt);
      initialPromptRef.current = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={optimisticMessages} />
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}
