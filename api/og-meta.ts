import type { VercelRequest, VercelResponse } from "@vercel/node";

// Call the dedicated og-proxy edge function (NOT mongo-api)
// because Supabase forces Content-Type: text/plain on all edge function responses.
// This Vercel function re-serves the HTML with the correct Content-Type: text/html.
const EDGE_FN_URL =
  "https://xqzffikjyrdmbuptreyj.supabase.co/functions/v1/og-proxy";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxemZmaWtqeXJkbWJ1cHRyZXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTU4NjksImV4cCI6MjA4NjkzMTg2OX0.1qIIHa1ctA3kEG56IZCIK9Ul7PO6iZWV_pYKKHwsiVo";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string | undefined;
  if (!slug) {
    res.status(400).send("Missing slug");
    return;
  }

  try {
    const upstream = await fetch(
      `${EDGE_FN_URL}?slug=${encodeURIComponent(slug)}`,
      {
        headers: {
          Authorization: `Bearer ${ANON_KEY}`,
        },
      }
    );
    const html = await upstream.text();

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, max-age=60");
    res.status(200).send(html);
  } catch {
    res.status(500).send("OG proxy error");
  }
}
