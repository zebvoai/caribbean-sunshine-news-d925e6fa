const PREVIEW_HOST_PATTERNS = ["lovable.app", "lovableproject.com"];

const isPreviewOrLocalHost = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    PREVIEW_HOST_PATTERNS.some((pattern) => host.includes(pattern)) ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
};

export const canUseSameOriginProxy = (): boolean => !isPreviewOrLocalHost();

/**
 * Routes public storage URLs through same-origin proxy on environments that support /api rewrites.
 * This avoids direct calls to storage domains that can be blocked on restrictive corporate networks.
 */
export const getProxiedAssetUrl = (url: string | null | undefined): string => {
  const raw = (url || "").trim();
  if (!raw) return "";
  if (!canUseSameOriginProxy()) return raw;

  try {
    const parsed = new URL(raw);
    const marker = "/storage/v1/object/public/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return raw;

    const objectPath = parsed.pathname.slice(idx + marker.length);
    const query = parsed.search || "";
    return `/api/storage/${objectPath}${query}`;
  } catch {
    return raw;
  }
};

export interface ImageOptimizeOptions {
  /** Target width in px. */
  width?: number;
  /** Target height in px. */
  height?: number;
  /** Output format. Defaults to webp. */
  format?: "webp" | "avif" | "origin";
  /** JPEG/WebP quality 20–100. Defaults to 75. */
  quality?: number;
  /** resize mode. Defaults to cover. */
  resize?: "cover" | "contain" | "fill";
}

/**
 * Returns an optimized image URL for a Supabase-hosted asset.
 * - Uses Supabase Storage image transformation (render/image/public/...) when applicable
 * - Adds width/format/quality query params for WebP conversion
 * - Falls back to the proxied original for non-Supabase URLs
 */
export const getOptimizedImageUrl = (
  url: string | null | undefined,
  opts: ImageOptimizeOptions = {}
): string => {
  const raw = (url || "").trim();
  if (!raw) return "";
  const { width, height, format = "webp", quality = 75, resize = "cover" } = opts;

  try {
    const parsed = new URL(raw, "https://placeholder.local");
    const marker = "/storage/v1/object/public/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) {
      // Non-Supabase (or already transformed) — return proxied original.
      return getProxiedAssetUrl(raw);
    }

    const objectPath = parsed.pathname.slice(idx + marker.length);
    const params = new URLSearchParams();
    if (width) params.set("width", String(width));
    if (height) params.set("height", String(height));
    if (format && format !== "origin") params.set("format", format);
    if (quality) params.set("quality", String(quality));
    if (resize) params.set("resize", resize);

    const qs = params.toString();
    if (canUseSameOriginProxy()) {
      return `/api/storage-render/${objectPath}${qs ? `?${qs}` : ""}`;
    }
    return `${parsed.origin}/storage/v1/render/image/public/${objectPath}${qs ? `?${qs}` : ""}`;
  } catch {
    return getProxiedAssetUrl(raw);
  }
};

const SUPABASE_ORIGIN = (() => {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL as string).origin;
  } catch {
    return "";
  }
})();

/**
 * Converts a same-origin proxied storage path back to its absolute storage URL.
 * Used as a last-resort fallback when the proxy hiccups (e.g. 502 from the CDN edge).
 */
export const getDirectAssetUrl = (url: string | null | undefined): string => {
  const raw = (url || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!SUPABASE_ORIGIN) return raw;

  const [pathOnly, query = ""] = raw.split("?");
  const qs = query ? `?${query}` : "";
  if (pathOnly.startsWith("/api/storage-render/")) {
    return `${SUPABASE_ORIGIN}/storage/v1/render/image/public/${pathOnly.slice("/api/storage-render/".length)}${qs}`;
  }
  if (pathOnly.startsWith("/api/storage/")) {
    return `${SUPABASE_ORIGIN}/storage/v1/object/public/${pathOnly.slice("/api/storage/".length)}${qs}`;
  }
  return raw;
};

/**
 * Ordered list of URLs to try for one image: optimized → proxied original → direct storage.
 * Deduplicated, empty entries removed.
 */
export const buildImageCandidates = (
  url: string | null | undefined,
  opts: ImageOptimizeOptions = {}
): string[] => {
  const raw = (url || "").trim();
  if (!raw) return [];
  const list = [
    getOptimizedImageUrl(raw, opts),
    getProxiedAssetUrl(raw),
    getDirectAssetUrl(getOptimizedImageUrl(raw, opts)),
    getDirectAssetUrl(getProxiedAssetUrl(raw)),
    raw,
  ].filter(Boolean);
  return Array.from(new Set(list));
};

/**
 * DOM-level image error recovery: retries the direct storage URL once when the
 * same-origin proxy fails. Returns true when a retry was scheduled.
 */
export const retryImageFallback = (img: HTMLImageElement): boolean => {
  if (img.dataset.directFallback === "true") return false;
  const direct = getDirectAssetUrl(img.getAttribute("src") || "");
  if (!direct || direct === img.getAttribute("src")) return false;
  img.dataset.directFallback = "true";
  img.src = direct;
  return true;
};
