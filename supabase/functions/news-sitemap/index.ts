import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE_URL = "https://www.dominicanews.dm";
const PUBLICATION_NAME = "Dominica News Online";
const MONGO_API_URL = Deno.env.get("SUPABASE_URL")! + "/functions/v1/mongo-api";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function fetchArticles() {
  const params = new URLSearchParams({ resource: "articles", status: "published", limit: "1000" });
  const res = await fetch(`${MONGO_API_URL}?${params}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

serve(async () => {
  try {
    const articles = await fetchArticles();

    // Google News sitemap only includes articles from the last 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    let urls = "";

    for (const a of articles) {
      const pubDate = a.published_at || a.created_at;
      if (!pubDate) continue;

      const publishedDate = new Date(pubDate);
      if (publishedDate < twoDaysAgo) continue;

      const categoryName = a.categories?.name || "News";
      const keywords = (a.tags && a.tags.length > 0) ? a.tags.join(", ") : "";

      urls += `  <url>
    <loc>${SITE_URL}/news/${escapeXml(a.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publishedDate.toISOString()}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>${keywords ? `\n      <news:keywords>${escapeXml(keywords)}</news:keywords>` : ""}
    </news:news>
  </url>\n`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=900",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (_e) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }
});
