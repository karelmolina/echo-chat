import { NextRequest, NextResponse } from "next/server";
import { getActiveStream } from "@/lib/stream-store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const streamId = await getActiveStream(id);

  if (!streamId) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json({ active: true, streamId });
}