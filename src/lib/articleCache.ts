// In-memory article data cache + intent prefetching for instant article opens.
import { mongoApi } from "@/lib/mongoApi";
import { getProxiedAssetUrl } from "@/lib/networkProxy";

const TTL = 5 * 60 * 1000;
const data = new Map<string, { value: any; at: number }>();
const inflight = new Map<string, Promise<any>>();

export function getCachedArticle(slug: string) {
  const hit = data.get(slug);
  return hit && Date.now() - hit.at < TTL ? hit.value : null;
}

export function fetchArticle(slug: string): Promise<any> {
  const cached = getCachedArticle(slug);
  if (cached) return Promise.resolve(cached);
  let p = inflight.get(slug);
  if (!p) {
    p = mongoApi
      .getArticleBySlug(slug)
      .then((a: any) => {
        data.set(slug, { value: a, at: Date.now() });
        if (a?.cover_image_url) {
          const img = new Image();
          img.referrerPolicy = "no-referrer";
          img.src = getProxiedAssetUrl(a.cover_image_url);
        }
        return a;
      })
      .finally(() => inflight.delete(slug));
    inflight.set(slug, p);
  }
  return p;
}

export function prefetchArticle(slug: string) {
  if (!slug || getCachedArticle(slug) || inflight.has(slug)) return;
  fetchArticle(slug).catch(() => {});
}
