import { initializeRedisClient } from "../utils/client.js";
import { bloomKey } from "../utils/keys.js";

const createBloomFilter = async () => {
  const client = await initializeRedisClient();

  await Promise.all([
    client.del(bloomKey),
    client.bf.reserve(bloomKey, 0.0001, 1000000),
  ]);
};

await createBloomFilter();
console.log("Bloom filter created");
process.exit(0);
