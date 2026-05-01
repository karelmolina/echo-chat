import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ChatMessage } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, createdAt: true },
  });

  const formattedMessages: ChatMessage[] = messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return NextResponse.json({ messages: formattedMessages });
}