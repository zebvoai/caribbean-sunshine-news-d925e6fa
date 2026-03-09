import { MongoClient, ObjectId } from "npm:mongodb@6";

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
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESC =
  "Your trusted source for breaking news, local updates, politics, business, culture, and community stories from Dominica and the Caribbean.";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Resolve the image URL for OG tags — must be a direct, permanent, publicly accessible URL */
function resolveOgImage(url: string | null | undefined): string {
  if (!url || url.startsWith("data:")) return DEFAULT_IMAGE;
  return url;
}

function buildHtml(m: {
  title: string;
  desc: string;
  image: string;
  url: string;
  date?: string;
  author?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${m.title}</title>
<meta name="description" content="${m.desc}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="${SITE_NAME}"/>
<meta property="og:title" content="${m.title}"/>
<meta property="og:description" content="${m.desc}"/>
<meta property="og:image" content="${esc(m.image)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:type" content="image/jpeg"/>
<meta property="og:url" content="${esc(m.url)}"/>
${m.date ? `<meta property="article:published_time" content="${esc(m.date)}"/>` : ""}
${m.author ? `<meta property="article:author" content="${esc(m.author)}"/>` : ""}
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@Dominicanewsdm"/>
<meta name="twitter:title" content="${m.title}"/>
<meta name="twitter:description" content="${m.desc}"/>
<meta name="twitter:image" content="${esc(m.image)}"/>
<meta http-equiv="refresh" content="0;url=${esc(m.url)}"/>
<link rel="canonical" href="${esc(m.url)}"/>
</head>
<body><p><a href="${esc(m.url)}">${m.title}</a></p></body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return new Response("Missing slug", { status: 400 });

  const pageUrl = `${SITE_URL}/news/${slug}`;

  // NOTE: Supabase edge runtime forces Content-Type to text/plain.
  // The Vercel api/og-meta.ts proxy re-sets it to text/html before reaching crawlers.
  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, s-maxage=300, max-age=60",
  };

  const fallback = () =>
    new Response(
      buildHtml({ title: SITE_NAME, desc: DEFAULT_DESC, image: DEFAULT_IMAGE, url: pageUrl }),
      { status: 200, headers }
    );

  try {
    const db = await getDb();
    const doc = await db.collection("articles").findOne(
      { slug, status: "published", $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
      { projection: { title: 1, excerpt: 1, featuredImage: 1, cover_image_url: 1, seo: 1, publishedAt: 1, author: 1 } }
    );

    console.log("og-proxy lookup:", slug, "found:", !!doc);
    if (!doc) return fallback();

    const title = esc(doc.seo?.metaTitle || doc.title || SITE_NAME);
    const desc = esc(doc.seo?.metaDescription || doc.excerpt || DEFAULT_DESC);
    const ogImage = resolveOgImage(doc.featuredImage || doc.cover_image_url);

    let authorName = "";
    if (doc.author) {
      try {
        const a = await db.collection("authors").findOne({ _id: new ObjectId(String(doc.author)) });
        if (a) authorName = a.name || a.full_name || "";
      } catch {
        /* skip */
      }
    }

    return new Response(
      buildHtml({
        title: `${title} | ${SITE_NAME}`,
        desc,
        image: ogImage,
        url: pageUrl,
        date: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : undefined,
        author: authorName || SITE_NAME,
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error("og-proxy error:", err);
    return fallback();
  }
});
