import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE_URL = "https://www.dominicanews.dm";
const FEED_TITLE = "Dominica News";
const FEED_DESCRIPTION = "Dominica's premier independent news platform – breaking news, politics, sports, culture and more.";
const MONGO_API_URL = Deno.env.get("SUPABASE_URL")! + "/functions/v1/mongo-api";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function fetchArticles() {
  const params = new URLSearchParams({ resource: "articles", status: "published", limit: "50" });
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
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

serve(async () => {
  try {
    const articles = await fetchArticles();

    const now = new Date().toUTCString();
    let lastBuildDate = now;
    if (articles.length > 0) {
      const latest = articles[0].published_at || articles[0].created_at;
      if (latest) lastBuildDate = new Date(latest).toUTCString();
    }

    let items = "";
    for (const a of articles) {
      const pubDate = a.published_at || a.created_at;
      const dateStr = pubDate ? new Date(pubDate).toUTCString() : now;
      const link = `${SITE_URL}/news/${a.slug}`;
      const categoryName = a.categories?.name || "";
      const description = a.excerpt || (a.body ? stripHtml(a.body).substring(0, 300) : "");

      items += `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${dateStr}</pubDate>
      <description>${escapeXml(description)}</description>${
        categoryName ? `\n      <category>${escapeXml(categoryName)}</category>` : ""
      }${
        a.cover_image_url
          ? `\n      <enclosure url="${escapeXml(a.cover_image_url)}" type="image/jpeg" length="0" />`
          : ""
      }${
        a.authors?.full_name
          ? `\n      <dc:creator>${escapeXml(a.authors.full_name)}</dc:creator>`
          : ""
      }
    </item>\n`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/favicon.svg</url>
      <title>${escapeXml(FEED_TITLE)}</title>
      <link>${SITE_URL}</link>
    </image>
${items}  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=900",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (_e) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Dominica News DM</title></channel></rss>`,
      { headers: { "Content-Type": "application/rss+xml" } }
    );
  }
});
