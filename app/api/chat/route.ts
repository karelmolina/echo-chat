import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createStream,
  appendChunk,
  markDone,
  setActiveStream,
  clearActiveStream,
  publishEvent,
} from "@/lib/stream-store";
import { createAIProvider } from "@/lib/ai/factory";
import type { Message } from "@/lib/ai/types";
import type { ChatRequest, StreamInitResponse } from "@/types";

function generateTitle(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "New Conversation";
  return trimmed.slice(0, 50);
}

async function streamResponse(
  streamId: string,
  conversationId: string
): Promise<void> {
  const provider = createAIProvider();
  let chunkId = 0;
  let fullContent = "";

  try {
    // Fetch conversation history
    const dbMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    const messages: Message[] = [
      { role: "system", content: "You are a helpful assistant." },
      ...dbMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    await provider.streamChat(messages, async (chunk) => {
      fullContent += chunk;
      await appendChunk(streamId, { id: chunkId++, data: chunk, done: false });
    });

    await appendChunk(streamId, { id: chunkId, data: "", done: true });
    await markDone(streamId);

    await prisma.message.create({
      data: {
        role: "assistant",
        content: fullContent,
        conversationId,
      },
    });
  } catch (error) {
    console.error("AI streaming error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    await appendChunk(streamId, {
      id: chunkId++,
      data: `\n\n[Error: ${errorMessage}]`,
      done: false,
    });
    await appendChunk(streamId, { id: chunkId, data: "", done: true });
    await markDone(streamId);
  } finally {
    await clearActiveStream(conversationId);
    await publishEvent(conversationId, {
      type: "stream-ended",
      streamId,
      conversationId,
    });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.message || body.message.trim() === "") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const conversationId = body.conversationId ?? crypto.randomUUID();
    const streamId = crypto.randomUUID();

    const existingConversation = body.conversationId
      ? await prisma.conversation.findUnique({
          where: { id: body.conversationId },
        })
      : null;

    const conversation = existingConversation
      ? await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        })
      : await prisma.conversation.create({
          data: {
            id: conversationId,
            title: generateTitle(body.message),
          },
        });

    await prisma.message.create({
      data: {
        role: "user",
        content: body.message,
        conversationId: conversation.id,
      },
    });

    await createStream(streamId, {
      conversationId: conversation.id,
      createdAt: new Date().toISOString(),
    });

    await setActiveStream(conversation.id, streamId);

    console.log(
      `[Chat] Publishing stream-started for conversation ${conversation.id}, stream ${streamId}`
    );

    await publishEvent(conversation.id, {
      type: "stream-started",
      streamId,
      conversationId: conversation.id,
    });
    console.log(`[Chat] Event published successfully`);

    streamResponse(streamId, conversation.id).catch((err) => {
      console.error("Stream generation error:", err);
    });

    const response: StreamInitResponse = {
      streamId,
      conversationId: conversation.id,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
