import type { VercelRequest, VercelResponse } from "@vercel/node";

const KEEP_ALIVE_URL =
  "https://xqzffikjyrdmbuptreyj.supabase.co/functions/v1/keep-alive";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxemZmaWtqeXJkbWJ1cHRyZXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTU4NjksImV4cCI6MjA4NjkzMTg2OX0.1qIIHa1ctA3kEG56IZCIK9Ul7PO6iZWV_pYKKHwsiVo";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const upstream = await fetch(KEEP_ALIVE_URL, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: "vercel-cron", at: new Date().toISOString() }),
    });
    const result = await upstream.text();

    res.setHeader("Cache-Control", "no-store");
    res.status(upstream.ok ? 200 : 502).json({
      ok: upstream.ok,
      upstreamStatus: upstream.status,
      result,
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : "Keep-alive request failed",
    });
  }
}