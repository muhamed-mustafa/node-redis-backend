import { SchemaFieldTypes } from "redis";
import { initializeRedisClient } from "../utils/client.js";
import { indexKey, getKeyName } from "../utils/keys.js";

export const createIndex = async () => {
  const client = await initializeRedisClient();

  try {
    await client.ft.dropIndex(indexKey);
  } catch (error) {
    console.log(error);
  }

  await client.ft.create(
    indexKey,
    {
      id: {
        type: SchemaFieldTypes.TEXT,
        AS: "id",
      },

      name: {
        type: SchemaFieldTypes.TEXT,
        AS: "name",
      },

      avgStars: {
        type: SchemaFieldTypes.NUMERIC,
        AS: "avgStars",
        SORTABLE: true,
      },
    },
    {
      ON: "HASH",
      PREFIX: getKeyName("restaurants"),
    }
  );
};

await createIndex();
console.log("Index created");
process.exit(0);
