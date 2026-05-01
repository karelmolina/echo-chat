"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ChatRequest, StreamInitResponse } from "@/types";

export default function HomePage(): React.JSX.Element {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const payload: ChatRequest = {
        message: input.trim(),
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = (await res.json()) as StreamInitResponse;
      router.push(`/${data.conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      setIsLoading(false);
    }
  };

  const handlePromptSelect = async (prompt: string): Promise<void> => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const payload: ChatRequest = {
        message: prompt,
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = (await res.json()) as StreamInitResponse;
      router.push(`/${data.conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Sidebar />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Echo Chat
          </h1>
          <p className="max-w-md text-muted-foreground">
            Ask anything and get an AI-powered response.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-lg items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>

        <SuggestedPrompts onSelect={handlePromptSelect} />
      </main>
    </>
  );
}
