import { createClient } from "redis";

const redisUrl = process.env.STORAGE_URL || process.env.REDIS_URL;

let client;

async function getRedisClient() {
  if (!redisUrl) {
    throw new Error("Missing STORAGE_URL or REDIS_URL");
  }

  if (!client) {
    client = createClient({ url: redisUrl });
    client.on("error", (err) => console.error("Redis Client Error", err));
    await client.connect();
  }

  return client;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "https://meetmacros.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const lead_key = req.query.lead;

    if (!lead_key) {
      return res.status(400).json({ error: "Missing lead" });
    }

    const redis = await getRedisClient();
    const url = await redis.get(`lead:${lead_key}`);

    if (!url) {
      return res.status(404).json({ error: "Checkout URL not found yet" });
    }

    return res.status(200).json({ url });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to resolve checkout URL",
      details: error.message
    });
  }
}
