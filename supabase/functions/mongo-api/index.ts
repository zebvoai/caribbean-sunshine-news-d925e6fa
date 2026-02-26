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

const sanitizeImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  // Strip base64 data URIs — they bloat responses and break on constrained devices
  if (url.startsWith("data:")) return null;
  return url;
};

const normalizeArticle = (doc: any, full = false) => {
  const base: any = {
    id: doc._id.toString(),
    title: doc.title || "",
    slug: doc.slug || "",
    excerpt: doc.excerpt || "",
    cover_image_url: sanitizeImageUrl(doc.featuredImage),
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
    author_id: doc.author?.toString() || null,
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
    base.additional_category_ids = (doc.categories || []).map((c: any) => c.toString());
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

const normalizeCategory = (doc: any, articlesCount?: number) => ({
  id: doc._id.toString(),
  name: doc.name,
  slug: doc.slug,
  description: doc.description || "",
  display_order: doc.displayOrder || 0,
  is_pinned: doc.isPinned || false,
  articles_count: articlesCount ?? 0,
  created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
});

const normalizeAuthor = (doc: any) => ({
  id: doc._id.toString(),
  full_name: doc.name || "Unknown",
  role: doc.title || "Reporter",
  email: doc.email || null,
  bio: doc.bio || null,
  avatar_url: doc.avatarUrl || doc.avatar || null,
  is_active: doc.isActive !== false,
  articles_count: doc.articlesCount || 0,
  expertise: doc.expertise || [],
  specialization: doc.specialization || [],
  location: doc.location || null,
  slug: doc.slug || null,
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

      // UPDATE (PATCH)
      if (req.method === "PATCH") {
        const id = url.searchParams.get("id");
        if (!id) return jsonError("id required", 400);
        const body = await req.json();
        const now = new Date();
        const update: any = {
          updatedAt: now,
        };
        if (body.title !== undefined) update.title = body.title;
        if (body.slug !== undefined) update.slug = body.slug;
        if (body.body !== undefined) update.content = body.body;
        if (body.excerpt !== undefined) update.excerpt = body.excerpt;
        if (body.cover_image_url !== undefined) update.featuredImage = body.cover_image_url;
        if (body.cover_image_alt !== undefined) update.featuredImageAlt = body.cover_image_alt;
        if (body.publication_status !== undefined) update.status = body.publication_status;
        if (body.published_at !== undefined) update.publishedAt = body.published_at ? new Date(body.published_at) : null;
        if (body.scheduled_for !== undefined) update.scheduledFor = body.scheduled_for ? new Date(body.scheduled_for) : null;
        if (body.is_breaking !== undefined) update.isBreaking = body.is_breaking;
        if (body.is_featured !== undefined) update.isFeatured = body.is_featured;
        if (body.is_pinned !== undefined) update.isPinned = body.is_pinned;
        if (body.meta_title !== undefined || body.meta_description !== undefined) {
          update.seo = {
            metaTitle: body.meta_title || null,
            metaDescription: body.meta_description || null,
          };
        }
        if (body.social_embeds !== undefined) {
          update.embeds = (body.social_embeds || []).map((e: any) => ({
            platform: e.platform,
            url: e.embed_url || null,
            code: e.embed_code || null,
          }));
        }
        if (body.author_id !== undefined) {
          try { update.author = body.author_id ? new ObjectId(body.author_id) : null; } catch {}
        }
        if (body.primary_category_id !== undefined) {
          try { update.category = body.primary_category_id ? new ObjectId(body.primary_category_id) : null; } catch {}
        }
        if (body.additional_category_ids !== undefined) {
          update.categories = (body.additional_category_ids || []).map((cid: string) => {
            try { return new ObjectId(cid); } catch { return null; }
          }).filter(Boolean);
        }
        await db.collection("articles").updateOne(
          { _id: new ObjectId(id) },
          { $set: update }
        );
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
      const categorySlug = url.searchParams.get("category_slug");
      const excludeId = url.searchParams.get("exclude_id");
      const isBreaking = url.searchParams.get("is_breaking");

      const filter: any = {};
      if (status && status !== "all") filter.status = status;
      if (isBreaking === "true") filter.isBreaking = true;

      // Resolve category by slug if provided
      if (categorySlug) {
        const catDoc = await db.collection("categories").findOne({ slug: categorySlug });
        if (catDoc) {
          // Match articles where the category is either primary OR in the additional categories array
          filter.$or = [
            { category: catDoc._id },
            { categories: catDoc._id },
          ];
        } else {
          // No category found with this slug — return empty
          return jsonResponse([]);
        }
      } else if (categoryId) {
        let catObjId: ObjectId | null = null;
        try { catObjId = new ObjectId(categoryId); } catch {}
        if (catObjId) {
          filter.$or = [
            { category: catObjId },
            { categories: catObjId },
          ];
        }
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
      // DELETE
      if (req.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return jsonError("id required", 400);
        await db.collection("categories").deleteOne({ _id: new ObjectId(id) });
        return jsonResponse({ success: true });
      }

      // CREATE
      if (req.method === "POST") {
        const body = await req.json();
        const now = new Date();
        const doc: any = {
          name: body.name,
          slug: body.slug,
          description: body.description || "",
          displayOrder: body.display_order ?? 0,
          isPinned: body.is_pinned || false,
          createdAt: now,
          updatedAt: now,
          __v: 0,
        };
        const result = await db.collection("categories").insertOne(doc);
        return jsonResponse({ id: result.insertedId.toString() });
      }

      // UPDATE (PATCH)
      if (req.method === "PATCH") {
        const id = url.searchParams.get("id");
        if (!id) return jsonError("id required", 400);
        const body = await req.json();
        const update: any = { updatedAt: new Date() };
        if (body.name !== undefined) update.name = body.name;
        if (body.slug !== undefined) update.slug = body.slug;
        if (body.description !== undefined) update.description = body.description;
        if (body.display_order !== undefined) update.displayOrder = body.display_order;
        if (body.is_pinned !== undefined) update.isPinned = body.is_pinned;
        await db.collection("categories").updateOne(
          { _id: new ObjectId(id) },
          { $set: update }
        );
        return jsonResponse({ success: true });
      }

      // GET list with article counts
      const docs = await db
        .collection("categories")
        .find({})
        .sort({ displayOrder: 1, name: 1 })
        .toArray();

      // Count articles per category (primary + additional)
      const counts: Record<string, number> = {};
      for (const cat of docs) {
        const count = await db.collection("articles").countDocuments({
          $or: [{ category: cat._id }, { categories: cat._id }],
        });
        counts[cat._id.toString()] = count;
      }

      return jsonResponse(docs.map((d) => normalizeCategory(d, counts[d._id.toString()] || 0)));
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
