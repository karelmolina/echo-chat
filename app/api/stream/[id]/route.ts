import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  return NextResponse.json(
    {
      error: "Not implemented",
      id,
    },
    { status: 501 }
  );
}
