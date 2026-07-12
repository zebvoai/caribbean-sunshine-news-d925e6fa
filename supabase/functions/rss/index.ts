import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE_URL = "https://www.dominicanews.dm";
const FEED_TITLE = "Dominica News";
const FEED_DESCRIPTION = "Dominica's premier independent news platform – breaking news, politics, sports, culture and more.";
const MONGO_API_URL = Deno.env.get("SUPABASE_URL")! + "/functions/v1/mongo-api";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function fetchArticles(categorySlug?: string) {
  const params = new URLSearchParams({ resource: "articles", status: "published", limit: "50" });
  if (categorySlug) params.set("category", categorySlug);
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

serve(async (req) => {
  try {
    const url = new URL(req.url);
    // Support both /rss.xml?category=politics and /rss/politics.xml style paths.
    let categorySlug = url.searchParams.get("category") || "";
    const pathMatch = url.pathname.match(/\/rss\/([^/.]+)\.xml$/i);
    if (!categorySlug && pathMatch) categorySlug = pathMatch[1];

    const articles = await fetchArticles(categorySlug || undefined);

    // Client-side filter fallback if backend does not honor the category param.
    const filtered = categorySlug
      ? articles.filter((a: any) => a.categories?.slug === categorySlug)
      : articles;

    const now = new Date().toUTCString();
    let lastBuildDate = now;
    if (filtered.length > 0) {
      const latest = filtered[0].published_at || filtered[0].created_at;
      if (latest) lastBuildDate = new Date(latest).toUTCString();
    }

    const feedTitle = categorySlug
      ? `${FEED_TITLE} — ${categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)}`
      : FEED_TITLE;
    const feedLink = categorySlug ? `${SITE_URL}/category/${categorySlug}` : SITE_URL;
    const selfHref = categorySlug ? `${SITE_URL}/rss/${categorySlug}.xml` : `${SITE_URL}/rss.xml`;
    const feedDesc = categorySlug
      ? `Latest ${categorySlug} news and updates from Dominica News.`
      : FEED_DESCRIPTION;

    let items = "";
    for (const a of filtered) {
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
    <title>${escapeXml(feedTitle)}</title>
    <link>${feedLink}</link>
    <description>${escapeXml(feedDesc)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${selfHref}" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/favicon.svg</url>
      <title>${escapeXml(feedTitle)}</title>
      <link>${feedLink}</link>
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
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Dominica News</title></channel></rss>`,
      { headers: { "Content-Type": "application/rss+xml" } }
    );
  }
});
