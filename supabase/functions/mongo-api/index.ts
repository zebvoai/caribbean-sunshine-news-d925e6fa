import { MongoClient, ObjectId } from "npm:mongodb@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

// ─── Normalizers ────────────────────────────────────────────────────────────

const normalizeArticle = (doc: any, full = false) => {
  const base: any = {
    id: doc._id.toString(),
    title: doc.title || "",
    slug: doc.slug || "",
    excerpt: doc.excerpt || "",
    cover_image_url: doc.featuredImage || null,
    cover_image_alt: doc.featuredImageAlt || null,
    is_breaking: doc.isBreaking || false,
    is_featured: doc.isFeatured || false,
    is_pinned: doc.isPinned || false,
    publication_status: doc.status || "draft",
    published_at: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
    scheduled_for: doc.scheduledFor ? new Date(doc.scheduledFor).toISOString() : null,
    view_count: doc.views || 0,
    meta_title: doc.seo?.metaTitle || doc.seo?.title || null,
    meta_description: doc.seo?.metaDescription || doc.seo?.description || null,
    primary_category_id: doc.category?.toString() || null,
    created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };

  if (full) {
    base.body = doc.content || doc.body || "";
    base.social_embeds = (doc.embeds || []).map((e: any) => ({
      platform: e.platform || "twitter",
      embed_url: e.url || e.embed_url || null,
      embed_code: e.code || e.embed_code || null,
    }));
    base.authors = doc._author
      ? {
          id: doc._author._id.toString(),
          full_name: doc._author.name || "Unknown",
          avatar_url: doc._author.avatarUrl || null,
          bio: doc._author.bio || null,
          role: "reporter",
        }
      : null;
    base.categories = doc._category
      ? { name: doc._category.name, slug: doc._category.slug }
      : null;
  }

  return base;
};

const normalizeCategory = (doc: any) => ({
  id: doc._id.toString(),
  name: doc.name,
  slug: doc.slug,
});

const normalizeAuthor = (doc: any) => ({
  id: doc._id.toString(),
  full_name: doc.name || "Unknown",
  role: "reporter",
  email: doc.email || null,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource") || "";
    const db = await getDb();

    // ── ARTICLES/VIEW (increment) ────────────────────────────────────────────
    if (resource === "articles/view" && req.method === "POST") {
      const { slug } = await req.json();
      await db.collection("articles").updateOne(
        { slug },
        { $inc: { views: 1 } }
      );
      return jsonResponse({ success: true });
    }

    // ── ARTICLES ─────────────────────────────────────────────────────────────
    if (resource === "articles") {
      // DELETE
      if (req.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return jsonError("id required", 400);
        await db.collection("articles").deleteOne({ _id: new ObjectId(id) });
        return jsonResponse({ success: true });
      }

      // CREATE
      if (req.method === "POST") {
        const body = await req.json();
        const now = new Date();
        const doc: any = {
          title: body.title,
          slug: body.slug,
          content: body.body || "",
          excerpt: body.excerpt || "",
          featuredImage: body.cover_image_url || null,
          featuredImageAlt: body.cover_image_alt || null,
          status: body.publication_status || "draft",
          publishedAt: body.published_at ? new Date(body.published_at) : null,
          scheduledFor: body.scheduled_for ? new Date(body.scheduled_for) : null,
          isBreaking: body.is_breaking || false,
          isFeatured: body.is_featured || false,
          isPinned: body.is_pinned || false,
          seo: {
            metaTitle: body.meta_title || null,
            metaDescription: body.meta_description || null,
          },
          embeds: (body.social_embeds || []).map((e: any) => ({
            platform: e.platform,
            url: e.embed_url || null,
            code: e.embed_code || null,
          })),
          views: 0,
          likes: 0,
          shares: 0,
          tags: [],
          gallery: [],
          comments: [],
          readingTime: 2,
          language: "en",
          createdAt: now,
          updatedAt: now,
        };

        if (body.author_id) {
          try { doc.author = new ObjectId(body.author_id); } catch {}
        }
        if (body.primary_category_id) {
          try { doc.category = new ObjectId(body.primary_category_id); } catch {}
        }
        if (body.additional_category_ids?.length) {
          doc.categories = body.additional_category_ids.map((id: string) => {
            try { return new ObjectId(id); } catch { return null; }
          }).filter(Boolean);
        }

        const result = await db.collection("articles").insertOne(doc);
        return jsonResponse({ id: result.insertedId.toString() });
      }

      // GET single by slug
      const slug = url.searchParams.get("slug");
      if (slug) {
        const doc = await db.collection("articles").findOne({ slug, status: "published" });
        if (!doc) return jsonError("Not found", 404);

        let _author = null;
        let _category = null;
        if (doc.author) {
          _author = await db.collection("authors").findOne({ _id: doc.author });
        }
        if (doc.category) {
          _category = await db.collection("categories").findOne({ _id: doc.category });
        }

        return jsonResponse(normalizeArticle({ ...doc, _author, _category }, true));
      }

      // GET single by id
      const id = url.searchParams.get("id");
      if (id) {
        try {
          const doc = await db.collection("articles").findOne({ _id: new ObjectId(id) });
          if (!doc) return jsonError("Not found", 404);
          return jsonResponse(normalizeArticle(doc, true));
        } catch {
          return jsonError("Invalid id", 400);
        }
      }

      // GET list
      const status = url.searchParams.get("status");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const categoryId = url.searchParams.get("category_id");
      const excludeId = url.searchParams.get("exclude_id");

      const isBreaking = url.searchParams.get("is_breaking");

      const filter: any = {};
      if (status && status !== "all") filter.status = status;
      if (isBreaking === "true") filter.isBreaking = true;
      if (categoryId) {
        try { filter.category = new ObjectId(categoryId); } catch {}
      }
      if (excludeId) {
        try { filter._id = { $ne: new ObjectId(excludeId) }; } catch {}
      }

      const docs = await db
        .collection("articles")
        .find(filter, { projection: { content: 0, body: 0 } }) // exclude body for list perf
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(limit)
        .toArray();

      return jsonResponse(docs.map((d) => normalizeArticle(d, false)));
    }

    // ── CATEGORIES ───────────────────────────────────────────────────────────
    if (resource === "categories") {
      const docs = await db
        .collection("categories")
        .find({})
        .sort({ displayOrder: 1, name: 1 })
        .toArray();
      return jsonResponse(docs.map(normalizeCategory));
    }

    // ── AUTHORS ──────────────────────────────────────────────────────────────
    if (resource === "authors") {
      const docs = await db
        .collection("authors")
        .find({})
        .sort({ name: 1 })
        .toArray();
      return jsonResponse(docs.map(normalizeAuthor));
    }

    return jsonError("Unknown resource", 400);
  } catch (err: any) {
    console.error("mongo-api error:", err);
    return jsonError(err.message || "Internal server error", 500);
  }
});
