import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;

  try {
    await prisma.conversation.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }
}
