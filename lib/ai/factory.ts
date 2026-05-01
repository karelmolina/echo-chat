import { env } from "@/lib/env";
import type { AIProvider } from "./types";
import { GroqProvider } from "./providers/groq";
import { OpenAIProvider } from "./providers/openai";

export function createAIProvider(): AIProvider {
  const provider = env.AI_PROVIDER ?? "groq";

  switch (provider) {
    case "groq": {
      if (!env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is required when AI_PROVIDER=groq");
      }
      return new GroqProvider(env.GROQ_API_KEY);
    }
    case "openai": {
      if (!env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");
      }
      return new OpenAIProvider(env.OPENAI_API_KEY);
    }
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
