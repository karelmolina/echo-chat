import OpenAI from "openai";
import type { AIProvider, Message } from "../types";

export class GroqProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void | Promise<void>
  ): Promise<void> {
    const stream = await this.client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        await onChunk(content);
      }
    }
  }
}
