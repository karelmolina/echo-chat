import { NextRequest, NextResponse } from "next/server";
import type { ChatRequest, ChatResponse } from "@/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.message || body.message.trim() === "") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response: ChatResponse = {
      conversationId: body.conversationId ?? crypto.randomUUID(),
      messageId: crypto.randomUUID(),
      content: `Echo: ${body.message}`,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
