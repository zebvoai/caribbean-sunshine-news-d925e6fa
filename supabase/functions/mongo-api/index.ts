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

const decodeDataUriImage = (
  dataUri: string
): { bytes: Uint8Array; contentType: string; extension: string } | null => {
  const match = dataUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const [, contentType, base64] = match;
  const mimeToExtension: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };

  const extension = mimeToExtension[contentType.toLowerCase()] || "jpg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return { bytes, contentType, extension };
};

function getStorageConfig() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Storage environment variables are not configured");
  }
  return { supabaseUrl, serviceKey };
}

async function uploadBytesToStorage(
  bytes: Uint8Array,
  contentType: string,
  extension: string
): Promise<string> {
  const { supabaseUrl, serviceKey } = getStorageConfig();
  const objectPath = `articles/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/article-images/${objectPath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body: bytes,
    }
  );

  if (!uploadRes.ok) {
    const details = await uploadRes.text();
    throw new Error(`Storage upload failed: ${uploadRes.status} ${details}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/article-images/${objectPath}`;
}

async function uploadDataUriToStorage(dataUri: string): Promise<string> {
  const parsed = decodeDataUriImage(dataUri);
  if (!parsed) throw new Error("Invalid data URI image format");
  return uploadBytesToStorage(parsed.bytes, parsed.contentType, parsed.extension);
}

async function uploadExternalUrlToStorage(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl, {
    headers: { "User-Agent": "DominicaNews/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const ct = res.headers.get("content-type") || "image/jpeg";
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
    "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
  };
  const extension = extMap[ct.split(";")[0].trim().toLowerCase()] || "jpg";
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length > 10 * 1024 * 1024) throw new Error("Image exceeds 10MB limit");

  return uploadBytesToStorage(bytes, ct, extension);
}

function isSupabaseStorageUrl(url: string): boolean {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  return url.startsWith(supabaseUrl);
}

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
    tags: doc.tags || [],
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

    // ── ARTICLES/REPAIR-IMAGES (one-time migration helper) ──────────────────
    if (resource === "articles/repair-images" && req.method === "POST") {
      const payload = await req.json().catch(() => ({}));
      const requestedLimit = Number(payload?.limit ?? 50);
      const limit = Number.isFinite(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 200)
        : 50;
      const dryRun = Boolean(payload?.dry_run);

      const docs = await db
        .collection("articles")
        .find({ featuredImage: { $type: "string", $regex: "^data:image/" } })
        .limit(limit)
        .toArray();

      let repaired = 0;
      let failed = 0;
      const errors: Array<{ id: string; reason: string }> = [];

      for (const doc of docs) {
        try {
          const uploadedUrl = await uploadDataUriToStorage(doc.featuredImage);
          if (!dryRun) {
            await db.collection("articles").updateOne(
              { _id: doc._id },
              {
                $set: {
                  featuredImage: uploadedUrl,
                  updatedAt: new Date(),
                },
              }
            );
          }
          repaired += 1;
        } catch (e: any) {
          failed += 1;
          errors.push({
            id: doc._id.toString(),
            reason: e?.message || "unknown error",
          });
        }
      }

      return jsonResponse({
        scanned: docs.length,
        repaired,
        failed,
        dry_run: dryRun,
        errors: errors.slice(0, 20),
      });
    }

    // ── ARTICLES/MIGRATE-IMAGES (move external URLs to Supabase Storage) ────
    if (resource === "articles/migrate-images" && req.method === "POST") {
      const payload = await req.json().catch(() => ({}));
      const requestedLimit = Number(payload?.limit ?? 50);
      const limit = Number.isFinite(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 200)
        : 50;

      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";

      // Find articles with non-null featuredImage that is NOT already in Supabase Storage
      const escapedUrl = supabaseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const docs = await db
        .collection("articles")
        .find({
          featuredImage: { $type: "string" },
          $and: [
            { featuredImage: { $not: { $regex: `^${escapedUrl}` } } },
            { featuredImage: { $not: { $regex: "^data:" } } },
            { featuredImage: { $not: { $eq: "" } } },
          ],
        })
        .limit(limit)
        .toArray();

      let migrated = 0;
      let failed = 0;
      const errors: Array<{ id: string; title: string; reason: string }> = [];

      for (const doc of docs) {
        const url = doc.featuredImage;
        if (!url || typeof url !== "string" || url.length < 5) continue;
        if (isSupabaseStorageUrl(url) || url.startsWith("data:")) continue;

        try {
          const newUrl = await uploadExternalUrlToStorage(url);
          await db.collection("articles").updateOne(
            { _id: doc._id },
            { $set: { featuredImage: newUrl, updatedAt: new Date() } }
          );
          migrated += 1;
        } catch (e: any) {
          failed += 1;
          errors.push({
            id: doc._id.toString(),
            title: doc.title || "",
            reason: e?.message || "unknown error",
          });
        }
      }

      return jsonResponse({ scanned: docs.length, migrated, failed, errors: errors.slice(0, 20) });
    }



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
        if (body.tags !== undefined) {
          update.tags = body.tags || [];
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
          tags: body.tags || [],
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
      // DELETE
      if (req.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return jsonError("id required", 400);
        await db.collection("authors").deleteOne({ _id: new ObjectId(id) });
        return jsonResponse({ success: true });
      }

      // CREATE
      if (req.method === "POST") {
        const body = await req.json();
        const now = new Date();
        const doc: any = {
          name: body.full_name || body.name,
          email: body.email || null,
          bio: body.bio || null,
          title: body.role || "Reporter",
          avatarUrl: body.avatar_url || null,
          isActive: body.is_active !== false,
          expertise: body.expertise || [],
          specialization: body.specialization || [],
          location: body.location || null,
          slug: body.slug || null,
          articlesCount: 0,
          createdAt: now,
          updatedAt: now,
          __v: 0,
        };
        const result = await db.collection("authors").insertOne(doc);
        return jsonResponse({ id: result.insertedId.toString() });
      }

      // UPDATE (PATCH)
      if (req.method === "PATCH") {
        const id = url.searchParams.get("id");
        if (!id) return jsonError("id required", 400);
        const body = await req.json();
        const update: any = { updatedAt: new Date() };
        if (body.full_name !== undefined) update.name = body.full_name;
        if (body.email !== undefined) update.email = body.email;
        if (body.bio !== undefined) update.bio = body.bio;
        if (body.role !== undefined) update.title = body.role;
        if (body.avatar_url !== undefined) update.avatarUrl = body.avatar_url;
        if (body.is_active !== undefined) update.isActive = body.is_active;
        if (body.location !== undefined) update.location = body.location;
        await db.collection("authors").updateOne(
          { _id: new ObjectId(id) },
          { $set: update }
        );
        return jsonResponse({ success: true });
      }

      // GET list
      const docs = await db
        .collection("authors")
        .find({})
        .sort({ name: 1 })
        .toArray();
      return jsonResponse(docs.map(normalizeAuthor));
    }

    // ── PAGES ─────────────────────────────────────────────────────────────────
    if (resource === "pages") {
      // DELETE
      if (req.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return jsonError("id required", 400);
        await db.collection("pages").deleteOne({ _id: new ObjectId(id) });
        return jsonResponse({ success: true });
      }

      // CREATE
      if (req.method === "POST") {
        const body = await req.json();
        const now = new Date();
        const doc: any = {
          title: body.title,
          subtitle: body.subtitle || null,
          slug: body.slug,
          body: body.body || "",
          is_active: body.is_active !== false,
          show_in_footer: body.show_in_footer !== false,
          display_order: body.display_order ?? 0,
          createdAt: now,
          updatedAt: now,
        };
        const result = await db.collection("pages").insertOne(doc);
        return jsonResponse({ id: result.insertedId.toString() });
      }

      // UPDATE (PATCH)
      if (req.method === "PATCH") {
        const id = url.searchParams.get("id");
        if (!id) return jsonError("id required", 400);
        const body = await req.json();
        const update: any = { updatedAt: new Date() };
        if (body.title !== undefined) update.title = body.title;
        if (body.subtitle !== undefined) update.subtitle = body.subtitle;
        if (body.slug !== undefined) update.slug = body.slug;
        if (body.body !== undefined) update.body = body.body;
        if (body.is_active !== undefined) update.is_active = body.is_active;
        if (body.show_in_footer !== undefined) update.show_in_footer = body.show_in_footer;
        if (body.display_order !== undefined) update.display_order = body.display_order;
        await db.collection("pages").updateOne(
          { _id: new ObjectId(id) },
          { $set: update }
        );
        return jsonResponse({ success: true });
      }

      // GET single by slug
      const slug = url.searchParams.get("slug");
      if (slug) {
        const doc = await db.collection("pages").findOne({ slug, is_active: { $ne: false } });
        if (!doc) return jsonError("Not found", 404);
        return jsonResponse({
          id: doc._id.toString(),
          title: doc.title,
          subtitle: doc.subtitle || null,
          slug: doc.slug,
          body: doc.body || "",
          is_active: doc.is_active !== false,
          show_in_footer: doc.show_in_footer !== false,
          display_order: doc.display_order || 0,
          created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
          updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
        });
      }

      // GET single by id
      const id = url.searchParams.get("id");
      if (id) {
        try {
          const doc = await db.collection("pages").findOne({ _id: new ObjectId(id) });
          if (!doc) return jsonError("Not found", 404);
          return jsonResponse({
            id: doc._id.toString(),
            title: doc.title,
            subtitle: doc.subtitle || null,
            slug: doc.slug,
            body: doc.body || "",
            is_active: doc.is_active !== false,
            show_in_footer: doc.show_in_footer !== false,
            display_order: doc.display_order || 0,
            created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
            updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
          });
        } catch {
          return jsonError("Invalid id", 400);
        }
      }

      // GET list
      const docs = await db
        .collection("pages")
        .find({})
        .sort({ display_order: 1, title: 1 })
        .toArray();
      return jsonResponse(docs.map((d: any) => ({
        id: d._id.toString(),
        title: d.title,
        subtitle: d.subtitle || null,
        slug: d.slug,
        body: d.body || "",
        is_active: d.is_active !== false,
        show_in_footer: d.show_in_footer !== false,
        display_order: d.display_order || 0,
        created_at: d.createdAt ? new Date(d.createdAt).toISOString() : null,
        updated_at: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
      })));
    }

    // ── TAGS ──────────────────────────────────────────────────────────────────
    if (resource === "tags") {
      // DELETE
      if (req.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return jsonError("id required", 400);
        await db.collection("tags").deleteOne({ _id: new ObjectId(id) });
        return jsonResponse({ success: true });
      }

      // CREATE
      if (req.method === "POST") {
        const body = await req.json();
        const now = new Date();
        const slug = (body.slug || body.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const existing = await db.collection("tags").findOne({ slug });
        if (existing) return jsonError("A tag with this slug already exists", 409);
        const doc: any = {
          name: body.name,
          slug,
          color: body.color || null,
          description: body.description || null,
          createdAt: now,
          updatedAt: now,
        };
        const result = await db.collection("tags").insertOne(doc);
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
        if (body.color !== undefined) update.color = body.color;
        if (body.description !== undefined) update.description = body.description;
        await db.collection("tags").updateOne(
          { _id: new ObjectId(id) },
          { $set: update }
        );
        return jsonResponse({ success: true });
      }

      // GET list
      const docs = await db.collection("tags").find({}).sort({ name: 1 }).toArray();
      return jsonResponse(docs.map((d: any) => ({
        id: d._id.toString(),
        name: d.name,
        slug: d.slug,
        color: d.color || null,
        description: d.description || null,
        created_at: d.createdAt ? new Date(d.createdAt).toISOString() : null,
        updated_at: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
      })));
    }

    // ── SETTINGS ──────────────────────────────────────────────────────────────
    if (resource === "settings") {
      // GET — returns the single settings document (or defaults)
      if (req.method === "GET") {
        const doc = await db.collection("settings").findOne({ _type: "site" });
        const defaults = {
          site_name: "Dominica News",
          site_tagline: "Your Trusted Caribbean News Source",
          site_description: "Breaking news, politics, weather, sports and entertainment from Dominica and the Caribbean.",
          contact_email: "",
          contact_phone: "",
          contact_address: "",
          logo_url: "",
          favicon_url: "",
          primary_color: "#1a7a3a",
          secondary_color: "#2563ba",
          accent_color: "#dc2626",
          font_heading: "Playfair Display",
          font_body: "Source Sans 3",
          social_facebook: "https://www.facebook.com/dominicanews",
          social_twitter: "https://www.facebook.com/dominicanews",
          social_instagram: "https://www.instagram.com/dominicanews",
          social_youtube: "https://www.youtube.com/channel/UCvtEDb_00XXqe9oFUAkJ9ww",
          meta_title: "Dominica News - Breaking News & Caribbean Coverage",
          meta_description: "Your trusted source for breaking news, politics, weather updates, and Caribbean coverage.",
          articles_per_page: 20,
          show_breaking_ticker: true,
          show_featured_section: true,
          maintenance_mode: false,
          google_analytics_id: "",
        };
        if (!doc) {
          return jsonResponse(defaults);
        }
        return jsonResponse({ ...defaults, ...doc, id: doc._id.toString() });
      }

      // PUT — upsert the settings document
      if (req.method === "PUT" || req.method === "PATCH" || req.method === "POST") {
        const body = await req.json();
        const now = new Date();
        // Remove any _id or id from body
        delete body._id;
        delete body.id;
        delete body._type;
        
        await db.collection("settings").updateOne(
          { _type: "site" },
          { $set: { ...body, _type: "site", updatedAt: now } },
          { upsert: true }
        );
        return jsonResponse({ success: true });
      }

      return jsonError("Method not allowed", 405);
    }

    return jsonError("Unknown resource", 400);
  } catch (err: any) {
    console.error("mongo-api error:", err);
    return jsonError(err.message || "Internal server error", 500);
  }
});
