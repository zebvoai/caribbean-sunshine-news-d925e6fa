import type { VercelRequest, VercelResponse } from "@vercel/node";

const EDGE_FN_URL =
  "https://xqzffikjyrdmbuptreyj.supabase.co/functions/v1/mongo-api";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug as string | undefined;
  if (!slug) {
    res.status(400).send("Missing slug");
    return;
  }

  try {
    const upstream = await fetch(
      `${EDGE_FN_URL}?resource=og-meta&slug=${encodeURIComponent(slug)}`
    );
    const html = await upstream.text();

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, max-age=60");
    res.status(200).send(html);
  } catch {
    res.status(500).send("OG proxy error");
  }
}
