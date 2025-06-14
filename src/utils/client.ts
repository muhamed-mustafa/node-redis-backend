import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

export const initializeRedisClient = async () => {
  if (!client) {
    client = createClient();

    client.on("error", (err) => console.log("Redis Client Error", err));

    client.on("connect", () => console.log("Redis Client Connected"));

    await client.connect();
  }

  return client;
};
