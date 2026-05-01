import Redis from "ioredis";
import { env } from "./env";

function createRedisClient(name: string): Redis {
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

  return client;
}

export const redisPub = createRedisClient("pub");
export const redisSub = createRedisClient("sub");
export const redisStream = createRedisClient("stream");
