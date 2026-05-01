"use client";

import { Button } from "@/components/ui/button";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

const SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a haiku about artificial intelligence",
  "What are the best practices for React performance?",
  "Summarize the theory of relativity",
];

export function SuggestedPrompts({
  onSelect,
}: SuggestedPromptsProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
      {SUGGESTIONS.map((prompt) => (
        <Button
          key={prompt}
          variant="outline"
          className="rounded-full text-sm px-4 py-2 h-auto"
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}
