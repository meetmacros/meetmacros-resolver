import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    const lead_key = req.query.lead;

    if (!lead_key) {
      return res.status(400).json({ error: "Missing lead" });
    }

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
