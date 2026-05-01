import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ChatRequest, ChatResponse } from "@/types";

function generateTitle(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "New Conversation";
  return trimmed.slice(0, 50);
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

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const assistantContent = `Echo: ${body.message}`;

    const assistantMessage = await prisma.message.create({
      data: {
        role: "assistant",
        content: assistantContent,
        conversationId: conversation.id,
      },
    });

    const response: ChatResponse = {
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      content: assistantContent,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
