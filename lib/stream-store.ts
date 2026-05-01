import { redisStream, redisPub } from "./redis";

const STREAM_TTL = 3600;

export interface StreamEvent {
  type: "stream-started" | "stream-ended";
  streamId: string;
  conversationId: string;
}

export interface StreamChunk {
  id: number;
  data: string;
  done: boolean;
}

export interface StreamMeta {
  conversationId: string;
  createdAt: string;
}

function chunksKey(streamId: string): string {
  return `stream:${streamId}:chunks`;
}

function metaKey(streamId: string): string {
  return `stream:${streamId}:meta`;
}

function doneKey(streamId: string): string {
  return `stream:${streamId}:done`;
}

export async function createStream(
  streamId: string,
  meta: StreamMeta
): Promise<void> {
  const pipeline = redisStream.pipeline();
  pipeline.hset(metaKey(streamId), meta);
  pipeline.expire(metaKey(streamId), STREAM_TTL);
  pipeline.expire(chunksKey(streamId), STREAM_TTL);
  pipeline.expire(doneKey(streamId), STREAM_TTL);
  await pipeline.exec();
}

export async function appendChunk(
  streamId: string,
  chunk: StreamChunk
): Promise<void> {
  await redisStream.rpush(chunksKey(streamId), JSON.stringify(chunk));
}

export async function getChunks(
  streamId: string,
  fromId?: number
): Promise<StreamChunk[]> {
  const chunks = await redisStream.lrange(chunksKey(streamId), 0, -1);
  const parsed = chunks.map((c) => JSON.parse(c) as StreamChunk);
  if (fromId !== undefined) {
    return parsed.filter((c) => c.id > fromId);
  }
  return parsed;
}

export async function markDone(streamId: string): Promise<void> {
  await redisStream.set(doneKey(streamId), "1", "EX", STREAM_TTL);
}

export async function isDone(streamId: string): Promise<boolean> {
  const value = await redisStream.get(doneKey(streamId));
  return value === "1";
}

export async function getStreamMeta(streamId: string): Promise<StreamMeta | null> {
  const meta = await redisStream.hgetall(metaKey(streamId));
  if (!meta || Object.keys(meta).length === 0) return null;
  return meta as unknown as StreamMeta;
}

export async function streamExists(streamId: string): Promise<boolean> {
  const meta = await redisStream.exists(metaKey(streamId));
  return meta === 1;
}

// Active stream tracking (for multi-tab sync)

function activeStreamKey(conversationId: string): string {
  return `conversation:${conversationId}:active-stream`;
}

export function eventsChannel(conversationId: string): string {
  return `conversation:${conversationId}:events`;
}

export async function setActiveStream(
  conversationId: string,
  streamId: string
): Promise<void> {
  await redisStream.set(activeStreamKey(conversationId), streamId, "EX", STREAM_TTL);
}

export async function getActiveStream(conversationId: string): Promise<string | null> {
  return await redisStream.get(activeStreamKey(conversationId));
}

export async function clearActiveStream(conversationId: string): Promise<void> {
  await redisStream.del(activeStreamKey(conversationId));
}

export async function publishEvent(
  conversationId: string,
  event: StreamEvent
): Promise<void> {
  await redisPub.publish(eventsChannel(conversationId), JSON.stringify(event));
}
