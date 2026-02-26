import { MongoClient } from "npm:mongodb@6";

const DB_NAME = "test";
let cachedClient: MongoClient | null = null;

async function getDb() {
  if (!cachedClient) {
    const uri = Deno.env.get("MONGODB_URI");
    if (!uri) throw new Error("MONGODB_URI is not configured");
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME);
}

const SITE_NAME = "Dominica News";
const SITE_URL = "https://www.dominicanews.dm";
const DEFAULT_IMAGE = "https://www.dominicanews.dm/favicon.svg";
const DEFAULT_DESC =
  "Your trusted source for breaking news, local updates, politics, business, culture, and community stories from Dominica and the Caribbean.";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildHtml(m: { title: string; desc: string; image: string; url: string; date?: string; author?: string }): string {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${m.title}</title>
<meta name="description" content="${m.desc}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="${SITE_NAME}"/>
<meta property="og:title" content="${m.title}"/>
<meta property="og:description" content="${m.desc}"/>
<meta property="og:image" content="${esc(m.image)}"/>
<meta property="og:url" content="${esc(m.url)}"/>
${m.date ? `<meta property="article:published_time" content="${esc(m.date)}"/>` : ""}
${m.author ? `<meta property="article:author" content="${esc(m.author)}"/>` : ""}
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${m.title}"/>
<meta name="twitter:description" content="${m.desc}"/>
<meta name="twitter:image" content="${esc(m.image)}"/>
<meta http-equiv="refresh" content="0;url=${esc(m.url)}"/>
<link rel="canonical" href="${esc(m.url)}"/>
</head><body><p><a href="${esc(m.url)}">${m.title}</a></p></body></html>`;
}

const respond = (body: string, status = 200) =>
  new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, s-maxage=300, max-age=60" } });

Deno.serve(async (req) => {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return new Response("Missing slug", { status: 400 });

  const pageUrl = `${SITE_URL}/news/${slug}`;
  const fallback = () => respond(buildHtml({ title: SITE_NAME, desc: DEFAULT_DESC, image: DEFAULT_IMAGE, url: pageUrl }));

  try {
    const db = await getDb();

    // MongoDB field names: title, excerpt, featuredImage, featuredImageAlt, seo.metaTitle, seo.metaDescription, publishedAt, author (ObjectId)
    const doc = await db.collection("articles").findOne(
      { slug, status: "published" },
      { projection: { title: 1, excerpt: 1, featuredImage: 1, cover_image_url: 1, seo: 1, publishedAt: 1, author: 1 } }
    );

    if (!doc) return fallback();

    const title = esc(doc.seo?.metaTitle || doc.seo?.title || doc.title || SITE_NAME);
    const desc = esc(doc.seo?.metaDescription || doc.seo?.description || doc.excerpt || DEFAULT_DESC);
    const rawImg = doc.featuredImage || doc.cover_image_url || "";
    const ogImage = rawImg && !rawImg.startsWith("data:") ? rawImg : DEFAULT_IMAGE;

    let authorName = "";
    if (doc.author) {
      try {
        const { ObjectId } = await import("npm:mongodb@6");
        const a = await db.collection("authors").findOne({ _id: new ObjectId(String(doc.author)) });
        if (a) authorName = a.name || a.full_name || "";
      } catch { /* skip */ }
    }

    return respond(buildHtml({
      title: `${title} | ${SITE_NAME}`,
      desc,
      image: ogImage,
      url: pageUrl,
      date: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : undefined,
      author: authorName || undefined,
    }));
  } catch (err) {
    console.error("og-proxy error:", err);
    return fallback();
  }
});
