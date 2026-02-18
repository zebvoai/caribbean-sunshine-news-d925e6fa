/**
 * Frontend helper for calling the mongo-api edge function.
 * All database operations go through this module.
 */

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mongo-api`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
};

async function get<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}?${qs}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

async function post<T>(params: Record<string, string>, body: unknown): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}?${qs}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

async function del<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}?${qs}`, { method: "DELETE", headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
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
  created_at: string | null;
  updated_at: string | null;
  // Full article only:
  body?: string;
  social_embeds?: { platform: string; embed_url: string | null; embed_code: string | null }[];
  authors?: { id: string; full_name: string; avatar_url: string | null; bio: string | null; role: string } | null;
  categories?: { name: string; slug: string } | null;
}

export interface MongoCategory {
  id: string;
  name: string;
  slug: string;
}

export interface MongoAuthor {
  id: string;
  full_name: string;
  role: string;
  email: string | null;
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
    exclude_id?: string;
  } = {}): Promise<MongoArticle[]> {
    const p: Record<string, string> = { resource: "articles" };
    if (params.status) p.status = params.status;
    if (params.limit) p.limit = String(params.limit);
    if (params.category_id) p.category_id = params.category_id;
    if (params.exclude_id) p.exclude_id = params.exclude_id;
    return get<MongoArticle[]>(p);
  },

  /** Get a single published article by slug (includes body, author, category) */
  getArticleBySlug(slug: string): Promise<MongoArticle> {
    return get<MongoArticle>({ resource: "articles", slug });
  },

  /** Create a new article */
  createArticle(payload: CreateArticlePayload): Promise<{ id: string }> {
    return post<{ id: string }>({ resource: "articles" }, payload);
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

  /** List all authors */
  getAuthors(): Promise<MongoAuthor[]> {
    return get<MongoAuthor[]>({ resource: "authors" });
  },
};
