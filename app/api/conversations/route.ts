import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ConversationsResponse } from "@/types";

export async function GET(): Promise<NextResponse> {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  const response: ConversationsResponse = {
    conversations: conversations.map((c) => ({
      id: c.id,
      title: c.title ?? "New Conversation",
      updatedAt: c.updatedAt.toISOString(),
    })),
  };

  return NextResponse.json(response);
}
