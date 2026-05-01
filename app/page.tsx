"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";

export default function HomePage(): React.JSX.Element {
  const router = useRouter();

  const handlePromptSelect = (prompt: string): void => {
    const id = crypto.randomUUID();
    router.push(`/${id}?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <>
      <Sidebar />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="size-8 text-primary" />
          </div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Welcome to Echo Chat
          </h1>
          <p className="max-w-md text-muted-foreground">
            Your AI companion for intelligent conversations. Select a suggestion
            below or start a new chat.
          </p>
        </div>
        <SuggestedPrompts onSelect={handlePromptSelect} />
      </main>
    </>
  );
}
