import { NextResponse } from "next/server";
import type { ConversationsResponse } from "@/types";

const MOCK_CONVERSATIONS: ConversationsResponse["conversations"] = [
  {
    id: "conv-001",
    title: "Quantum Computing Explained",
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "conv-002",
    title: "React Performance Tips",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "conv-003",
    title: "Haiku About AI",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export async function GET(): Promise<NextResponse> {
  const response: ConversationsResponse = {
    conversations: MOCK_CONVERSATIONS,
  };

  return NextResponse.json(response);
}
