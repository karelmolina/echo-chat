export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIProvider {
  streamChat(
    messages: Message[],
    onChunk: (chunk: string) => void | Promise<void>
  ): Promise<void>;
}
