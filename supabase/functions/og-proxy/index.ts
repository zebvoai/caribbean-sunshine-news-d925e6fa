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
  "Stay updated with the latest Dominica news, breaking stories, politics, business, and Caribbean updates. Trusted source for accurate and timely news.";

function esc(s: unknown): string {
  const str = String(s ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveOgImage(url: string | null | undefined): string {
  if (!url || url.startsWith("data:")) return DEFAULT_IMAGE;
  return url;
}

function isTemporarySocialCdn(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes("fbcdn.net") || hostname.includes("cdninstagram.com");
  } catch {
    return false;
  }
}

function getReliableOgImage(url: string | null | undefined): string {
  const resolved = resolveOgImage(url);
  if (resolved === DEFAULT_IMAGE) return resolved;
  if (isTemporarySocialCdn(resolved)) return DEFAULT_IMAGE;
  return resolved;
}

/** Strip HTML tags and return plain text */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Convert basic HTML to readable paragraphs for crawlers */
function htmlToReadable(html: string): string {
  // Preserve paragraph structure
  let result = html
    .replace(/<\/p>/gi, "</p>\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "</h>\n")
    .replace(/<\/li>/gi, "</li>\n")
    .replace(/<\/blockquote>/gi, "</blockquote>\n");

  // Strip remaining tags
  result = result.replace(/<[^>]+>/g, "");

  // Clean up whitespace
  result = result
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${esc(line)}</p>`)
    .join("\n");

  return result;
}

function buildHtml(m: {
  title: string;
  desc: string;
  image: string;
  url: string;
  date?: string;
  author?: string;
  body?: string;
  categoryName?: string;
  isBreaking?: boolean;
}): string {
  const wordCount = m.body ? stripHtml(m.body).split(/\s+/).filter(Boolean).length : 0;
  const readableBody = m.body ? htmlToReadable(m.body) : "";

  // Build JSON-LD structured data
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": m.url },
    headline: m.title.replace(` | ${SITE_NAME}`, ""),
    description: m.desc,
    image: m.image ? [m.image] : [],
    datePublished: m.date,
    dateModified: m.date,
    wordCount,
    articleSection: m.categoryName || "News",
    author: m.author
      ? { "@type": "Person", name: m.author }
      : { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.svg`,
        width: 180,
        height: 180,
      },
    },
    url: m.url,
    isAccessibleForFree: true,
    inLanguage: "en",
  };
  if (m.isBreaking) {
    jsonLd.genre = "Breaking News";
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${m.title}</title>
<meta name="description" content="${m.desc}"/>
<link rel="canonical" href="${esc(m.url)}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="${SITE_NAME}"/>
<meta property="og:title" content="${m.title}"/>
<meta property="og:description" content="${m.desc}"/>
<meta property="og:image" content="${esc(m.image)}"/>
<meta property="og:image:secure_url" content="${esc(m.image)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url" content="${esc(m.url)}"/>
${m.date ? `<meta property="article:published_time" content="${esc(m.date)}"/>` : ""}
${m.author ? `<meta property="article:author" content="${esc(m.author)}"/>` : ""}
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@Dominicanewsdm"/>
<meta name="twitter:title" content="${m.title}"/>
<meta name="twitter:description" content="${m.desc}"/>
<meta name="twitter:image" content="${esc(m.image)}"/>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<header>
<h1>${m.title}</h1>
${m.author ? `<p>By ${esc(m.author)}</p>` : ""}
${m.date ? `<time datetime="${esc(m.date)}">${new Date(m.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>` : ""}
${m.categoryName ? `<p>Category: ${esc(m.categoryName)}</p>` : ""}
</header>
${m.image !== DEFAULT_IMAGE ? `<img src="${esc(m.image)}" alt="${m.title}" width="1200" height="630"/>` : ""}
<article>
${m.desc ? `<p><strong>${m.desc}</strong></p>` : ""}
${readableBody}
</article>
<footer>
<p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. <a href="${SITE_URL}">${SITE_URL}</a></p>
</footer>
</body>
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
      {
        projection: {
          title: 1, excerpt: 1, body: 1, content: 1,
          featuredImage: 1, cover_image_url: 1,
          seo: 1, publishedAt: 1, author: 1,
          category: 1, categories: 1,
          is_breaking: 1, isBreaking: 1,
        },
      }
    );

    console.log("og-proxy lookup:", slug, "found:", !!doc);
    if (!doc) return fallback();

    const title = esc(doc.seo?.metaTitle || doc.title || SITE_NAME);
    const desc = esc(doc.seo?.metaDescription || doc.excerpt || DEFAULT_DESC);
    const ogImage = getReliableOgImage(doc.featuredImage || doc.cover_image_url);
    const articleBody = doc.body || doc.content || "";
    const categoryName = doc.categories?.name || doc.category || "";

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
        body: articleBody,
        categoryName,
        isBreaking: doc.is_breaking || doc.isBreaking || false,
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error("og-proxy error:", err);
    return fallback();
  }
});
