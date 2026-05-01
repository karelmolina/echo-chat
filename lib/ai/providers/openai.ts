import OpenAI from "openai";
import type { AIProvider, Message } from "../types";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void | Promise<void>
  ): Promise<void> {
    const stream = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
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
