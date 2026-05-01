import { NextRequest } from "next/server";
import {
  getChunks,
  isDone,
  streamExists,
} from "@/lib/stream-store";

const KEEPALIVE_INTERVAL = 15000;
const POLL_INTERVAL = 100;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const lastEventId = request.nextUrl.searchParams.get("lastEventId");
  const fromId = lastEventId ? parseInt(lastEventId, 10) : -1;

  const exists = await streamExists(id);
  if (!exists) {
    return new Response("Stream not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let keepAliveTimer: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      let currentId = fromId;
      let done = await isDone(id);

      const sendChunk = (chunk: { id: number; data: string; done: boolean }) => {
        const data = `data: ${JSON.stringify(chunk)}\n`;
        const idLine = `id: ${chunk.id}\n`;
        controller.enqueue(encoder.encode(`${idLine}${data}\n`));
        currentId = chunk.id;
      };

      const sendKeepAlive = () => {
        controller.enqueue(encoder.encode(":keepalive\n\n"));
      };

      const existingChunks = await getChunks(id, fromId >= 0 ? fromId : undefined);
      for (const chunk of existingChunks) {
        sendChunk(chunk);
        if (chunk.done) done = true;
      }

      if (done) {
        controller.close();
        return;
      }

      const pollTimer = setInterval(async () => {
        const chunks = await getChunks(id, currentId);
        for (const chunk of chunks) {
          sendChunk(chunk);
          if (chunk.done) {
            done = true;
            clearInterval(pollTimer);
            clearInterval(keepAliveTimer);
            controller.close();
            return;
          }
        }
      }, POLL_INTERVAL);

      keepAliveTimer = setInterval(sendKeepAlive, KEEPALIVE_INTERVAL);

      request.signal.addEventListener("abort", () => {
        clearInterval(pollTimer);
        clearInterval(keepAliveTimer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
