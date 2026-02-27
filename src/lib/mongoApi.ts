/**
 * Frontend helper for calling the mongo-api edge function.
 * All database operations go through this module.
 */

const DIRECT_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mongo-api`;
const PROXY_BASE = "/api/mongo-api";
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const isPreviewHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("lovable.app") ||
    window.location.hostname.includes("lovableproject.com"));

const BASES = isPreviewHost ? [DIRECT_BASE] : [PROXY_BASE, DIRECT_BASE];

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

async function fetchJsonSafely<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    const preview = text.substring(0, 180).replace(/\s+/g, " ").trim();
    throw new Error(
      `Unexpected response format (${contentType || "unknown"}). Status ${response.status}. ${preview || "Empty response."}`
    );
  }

  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data as T;
}

async function requestWithFallback<T>(params: Record<string, string>, init?: RequestInit): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  let lastError: Error | null = null;

  for (const base of BASES) {
    try {
      return await fetchJsonSafely<T>(`${base}?${qs}`, init);
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw lastError || new Error("Request failed");
}

async function get<T>(params: Record<string, string>): Promise<T> {
  return requestWithFallback<T>(params);
}

async function post<T>(params: Record<string, string>, body: unknown): Promise<T> {
  return requestWithFallback<T>(params, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function del<T>(params: Record<string, string>): Promise<T> {
  return requestWithFallback<T>(params, { method: "DELETE" });
}

// ─── Article types ────────────────────────────────────────────────────────────

export interface MongoArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  is_breaking: boolean;
  is_featured: boolean;
  is_pinned: boolean;
  publication_status: string;
  published_at: string | null;
  scheduled_for: string | null;
  view_count: number;
  meta_title: string | null;
  meta_description: string | null;
  primary_category_id: string | null;
  author_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Full article only:
  body?: string;
  additional_category_ids?: string[];
  social_embeds?: { platform: string; embed_url: string | null; embed_code: string | null }[];
  authors?: { id: string; full_name: string; avatar_url: string | null; bio: string | null; role: string } | null;
  categories?: { name: string; slug: string } | null;
}

export interface MongoCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_pinned: boolean;
  articles_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface MongoAuthor {
  id: string;
  full_name: string;
  role: string;
  email: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  articles_count: number;
  expertise: string[];
  specialization: string[];
  location: string | null;
  slug: string | null;
}

export interface CreateArticlePayload {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  author_id?: string | null;
  primary_category_id?: string | null;
  additional_category_ids?: string[];
  publication_status: "draft" | "published" | "scheduled";
  published_at?: string | null;
  scheduled_for?: string | null;
  is_breaking?: boolean;
  is_featured?: boolean;
  is_pinned?: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
  social_embeds?: { platform: string; embed_url?: string | null; embed_code?: string | null }[];
}

// ─── API methods ─────────────────────────────────────────────────────────────

export const mongoApi = {
  /** List articles with optional filters */
  getArticles(params: {
    status?: string;
    limit?: number;
    category_id?: string;
    category_slug?: string;
    exclude_id?: string;
    is_breaking?: boolean;
  } = {}): Promise<MongoArticle[]> {
    const p: Record<string, string> = { resource: "articles" };
    if (params.status) p.status = params.status;
    if (params.limit) p.limit = String(params.limit);
    if (params.category_id) p.category_id = params.category_id;
    if (params.category_slug) p.category_slug = params.category_slug;
    if (params.exclude_id) p.exclude_id = params.exclude_id;
    if (params.is_breaking) p.is_breaking = "true";
    return get<MongoArticle[]>(p);
  },

  /** Get a single published article by slug (includes body, author, category) */
  getArticleBySlug(slug: string): Promise<MongoArticle> {
    return get<MongoArticle>({ resource: "articles", slug });
  },

  /** Get a single article by id (admin use, includes body) */
  getArticleById(id: string): Promise<MongoArticle> {
    return get<MongoArticle>({ resource: "articles", id });
  },

  /** Create a new article */
  createArticle(payload: CreateArticlePayload): Promise<{ id: string }> {
    return post<{ id: string }>({ resource: "articles" }, payload);
  },

  /** Update an existing article by id */
  updateArticle(id: string, payload: Partial<CreateArticlePayload>): Promise<{ success: boolean }> {
    return requestWithFallback<{ success: boolean }>(
      { resource: "articles", id },
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
  },

  /** Delete an article by id */
  deleteArticle(id: string): Promise<{ success: boolean }> {
    return del<{ success: boolean }>({ resource: "articles", id });
  },

  /** Increment view count for an article */
  incrementView(slug: string): Promise<{ success: boolean }> {
    return post<{ success: boolean }>({ resource: "articles/view" }, { slug });
  },

  /** List all categories */
  getCategories(): Promise<MongoCategory[]> {
    return get<MongoCategory[]>({ resource: "categories" });
  },

  /** Create a new category */
  createCategory(payload: { name: string; slug: string; description?: string; display_order?: number; is_pinned?: boolean }): Promise<{ id: string }> {
    return post<{ id: string }>({ resource: "categories" }, payload);
  },

  /** Update a category */
  updateCategory(id: string, payload: Partial<{ name: string; slug: string; description: string; display_order: number; is_pinned: boolean }>): Promise<{ success: boolean }> {
    return requestWithFallback<{ success: boolean }>(
      { resource: "categories", id },
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
  },

  /** Delete a category */
  deleteCategory(id: string): Promise<{ success: boolean }> {
    return del<{ success: boolean }>({ resource: "categories", id });
  },

  /** List all authors */
  getAuthors(): Promise<MongoAuthor[]> {
    return get<MongoAuthor[]>({ resource: "authors" });
  },

  /** Create a new author */
  createAuthor(payload: { full_name: string; email?: string; bio?: string; role?: string; avatar_url?: string; is_active?: boolean; location?: string; slug?: string }): Promise<{ id: string }> {
    return post<{ id: string }>({ resource: "authors" }, payload);
  },

  /** Update an author */
  updateAuthor(id: string, payload: Partial<{ full_name: string; email: string; bio: string; role: string; avatar_url: string; is_active: boolean; location: string }>): Promise<{ success: boolean }> {
    return requestWithFallback<{ success: boolean }>(
      { resource: "authors", id },
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
  },

  /** Delete an author */
  deleteAuthor(id: string): Promise<{ success: boolean }> {
    return del<{ success: boolean }>({ resource: "authors", id });
  },

  /** Repair legacy base64 article images by migrating them to storage URLs */
  repairLegacyImages(limit = 30): Promise<{
    scanned: number;
    repaired: number;
    failed: number;
    dry_run: boolean;
    errors: Array<{ id: string; reason: string }>;
  }> {
    return post<{
      scanned: number;
      repaired: number;
      failed: number;
      dry_run: boolean;
      errors: Array<{ id: string; reason: string }>;
    }>({ resource: "articles/repair-images" }, { limit });
  },

  /** Migrate external image URLs to Supabase Storage */
  migrateExternalImages(limit = 50): Promise<{
    scanned: number;
    migrated: number;
    failed: number;
    errors: Array<{ id: string; title: string; reason: string }>;
  }> {
    return post<{
      scanned: number;
      migrated: number;
      failed: number;
      errors: Array<{ id: string; title: string; reason: string }>;
    }>({ resource: "articles/migrate-images" }, { limit });
  },
};
