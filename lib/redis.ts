import Redis from "ioredis";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __redisPub: Redis | undefined;
  // eslint-disable-next-line no-var
  var __redisSub: Redis | undefined;
  // eslint-disable-next-line no-var
  var __redisStream: Redis | undefined;
}

function getRedisClient(name: string, globalKey: "__redisPub" | "__redisSub" | "__redisStream"): Redis {
  const existing = globalThis[globalKey];
  if (existing) {
    return existing;
  }

  const client = new Redis(env.REDIS_URL, {
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err: Error) => {
      const message = err.message;
      if (message.includes("READONLY")) {
        return true;
      }
      return false;
    },
  });

  client.on("error", (err: Error) => {
    console.error(`Redis ${name} connection error:`, err.message);
  });

  client.on("connect", () => {
    console.log(`Redis ${name} connected`);
  });

  client.on("reconnecting", () => {
    console.log(`Redis ${name} reconnecting...`);
  });

  globalThis[globalKey] = client;
  return client;
}

// Pub/Sub require separate connections per Redis protocol.
// All three are singletons to prevent connection exhaustion in serverless.
export const redisPub = getRedisClient("pub", "__redisPub");
export const redisSub = getRedisClient("sub", "__redisSub");
export const redisStream = getRedisClient("stream", "__redisStream");
