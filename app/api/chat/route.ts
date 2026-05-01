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
import type { ChatRequest, StreamInitResponse } from "@/types";

function generateTitle(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "New Conversation";
  return trimmed.slice(0, 50);
}

async function streamResponse(
  streamId: string,
  content: string,
  conversationId: string
): Promise<void> {
  const words = content.split(" ");
  let chunkId = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const data = i === 0 ? word : " " + word;
    await appendChunk(streamId, { id: chunkId++, data, done: false });
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  await appendChunk(streamId, { id: chunkId, data: "", done: true });
  await markDone(streamId);

  await prisma.message.create({
    data: {
      role: "assistant",
      content: content,
      conversationId: conversationId,
    },
  });

  await clearActiveStream(conversationId);
  await publishEvent(conversationId, {
    type: "stream-ended",
    streamId,
    conversationId,
  });
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

    console.log(`[Chat] Publishing stream-started for conversation ${conversation.id}, stream ${streamId}`);

    await publishEvent(conversation.id, {
      type: "stream-started",
      streamId,
      conversationId: conversation.id,
    });
    console.log(`[Chat] Event published successfully`);

    const assistantContent = `Echo: ${body.message}`;

    streamResponse(streamId, assistantContent, conversation.id).catch((err) => {
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
