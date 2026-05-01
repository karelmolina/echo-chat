import { NextRequest } from "next/server";
import { redisSub } from "@/lib/redis";
import { eventsChannel } from "@/lib/stream-store";

const KEEPALIVE_INTERVAL = 15000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const channel = eventsChannel(id);
  const encoder = new TextEncoder();

  let keepAliveTimer: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      const sendKeepAlive = () => {
        controller.enqueue(encoder.encode(":keepalive\n\n"));
      };

      console.log(`[Events] Subscribing to channel: ${channel}`);
      
      // Subscribe to Redis channel
      await redisSub.subscribe(channel);
      console.log(`[Events] Subscribed successfully to ${channel}`);

      const messageHandler = (receivedChannel: string, message: string) => {
        console.log(`[Events] Received message on ${receivedChannel}:`, message);
        if (receivedChannel === channel) {
          sendEvent(message);
        }
      };

      redisSub.on("message", messageHandler);

      keepAliveTimer = setInterval(sendKeepAlive, KEEPALIVE_INTERVAL);

      // Cleanup on disconnect
      request.signal.addEventListener("abort", () => {
        console.log(`[Events] Connection aborted for ${channel}`);
        clearInterval(keepAliveTimer);
        redisSub.unsubscribe(channel);
        redisSub.off("message", messageHandler);
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