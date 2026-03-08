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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { lead_key, checkout_url } = body || {};

    if (!lead_key || !checkout_url) {
      return res.status(400).json({ error: "lead_key and checkout_url are required" });
    }

    const redis = await getRedisClient();

    await redis.set(`lead:${lead_key}`, checkout_url, {
      EX: 60 * 60 * 24 * 7
    });

    return res.status(200).json({
      ok: true,
      lead_key,
      checkout_page_url: `https://meetmacros.com/start?lead=${encodeURIComponent(lead_key)}`
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to save checkout URL",
      details: error.message
    });
  }
}
