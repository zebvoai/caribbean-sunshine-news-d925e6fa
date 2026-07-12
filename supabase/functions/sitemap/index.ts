import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SITE_URL = "https://www.dominicanews.dm";
const MONGO_API_URL = Deno.env.get("SUPABASE_URL")! + "/functions/v1/mongo-api";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function fetchResource(resource: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ resource, ...extra });
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
    const [articles, categories, pages, liveUpdates, authors, tags] = await Promise.all([
      fetchResource("articles", { status: "published" }),
      fetchResource("categories"),
      fetchResource("pages"),
      fetchResource("liveupdates"),
      fetchResource("authors"),
      fetchResource("tags"),
    ]);

    let urls = "";

    // Homepage
    urls += `  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>\n`;

    // Static evergreen landing pages
    const currentYear = new Date().getUTCFullYear();
    const staticEvergreen = [
      { path: "/obituaries", changefreq: "daily", priority: "0.7" },
      { path: `/dominica-carnival-${currentYear}`, changefreq: "weekly", priority: "0.7" },
      { path: `/wcmf-${currentYear}`, changefreq: "weekly", priority: "0.7" },
      { path: `/miss-dominica-${currentYear}`, changefreq: "weekly", priority: "0.7" },
      { path: "/people/patrick-john", changefreq: "monthly", priority: "0.5" },
      { path: "/people/dame-eugenia-charles", changefreq: "monthly", priority: "0.5" },
      { path: "/people/roosevelt-skerrit", changefreq: "monthly", priority: "0.6" },
    ];
    for (const s of staticEvergreen) {
      urls += `  <url>
    <loc>${SITE_URL}${s.path}</loc>
    <changefreq>${s.changefreq}</changefreq>
    <priority>${s.priority}</priority>
  </url>\n`;
    }

    // Articles
    for (const a of articles) {
      const lastmod = a.updated_at || a.published_at || a.created_at;
      urls += `  <url>
    <loc>${SITE_URL}/news/${escapeXml(a.slug)}</loc>${lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    }

    // Categories (skip empty)
    for (const c of categories) {
      if ((c.articles_count ?? 0) <= 0) continue;
      urls += `  <url>
    <loc>${SITE_URL}/category/${escapeXml(c.slug)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>\n`;
    }

    // Author profile pages
    for (const a of authors) {
      const slug = a.slug || null;
      if (!slug) continue;
      if (a.is_active === false) continue;
      urls += `  <url>
    <loc>${SITE_URL}/author/${escapeXml(slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>\n`;
    }

    // Tag archives
    for (const t of tags) {
      if (!t.slug) continue;
      urls += `  <url>
    <loc>${SITE_URL}/tag/${escapeXml(t.slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>\n`;
    }

    // Pages
    for (const p of pages) {
      if (!p.is_active) continue;
      urls += `  <url>
    <loc>${SITE_URL}/page/${escapeXml(p.slug)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>\n`;
    }

    // Live Updates
    for (const l of liveUpdates) {
      if (l.publication_status !== "published") continue;
      urls += `  <url>
    <loc>${SITE_URL}/live/${escapeXml(l.slug)}</loc>${l.updated_at ? `\n    <lastmod>${new Date(l.updated_at).toISOString()}</lastmod>` : ""}
    <changefreq>hourly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { "Content-Type": "application/xml" },
    });
  }
});
