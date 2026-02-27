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
