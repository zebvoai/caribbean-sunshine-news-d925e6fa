import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SocialEmbedProps {
  platform: string;
  embed_url: string | null;
  embed_code: string | null;
}

/**
 * Extracts a YouTube video ID from various URL formats.
 */
const getYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
};

/**
 * Extracts a Spotify embed path from a URL.
 * e.g. https://open.spotify.com/track/xyz → track/xyz
 */
const getSpotifyPath = (url: string): string | null => {
  const match = url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
  if (match) return `${match[1]}/${match[2]}`;
  return null;
};

/**
 * Extracts an Instagram shortcode from various URL formats.
 * Supports /p/, /reel/, /tv/ paths.
 */
const getInstagramShortcode = (url: string): string | null => {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

/**
 * Extracts a Twitter/X tweet URL path for embedding.
 * Supports twitter.com and x.com status URLs.
 */
const getTwitterTweetUrl = (url: string): string | null => {
  const match = url.match(/(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/);
  return match ? `https://x.com/${match[1]}/status/${match[2]}` : null;
};

/**
 * Extracts a TikTok video ID from various URL formats.
 * Supports /video/{id} and /@user/video/{id}
 */
const getTikTokVideoId = (url: string): string | null => {
  const match = url.match(/tiktok\.com\/(?:@[\w.]+\/)?video\/(\d+)/);
  return match ? match[1] : null;
};

const isFacebookShareUrl = (url: string): boolean =>
  /facebook\.com\/share\/[a-z0-9]+\//i.test(url);

const cleanFacebookUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith("facebook.com")) return url;
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
};

/**
 * Facebook embed using the JS SDK for proper responsive rendering.
 */
const FacebookEmbed = ({ url, pluginType }: { url: string; pluginType: "video" | "post" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Facebook SDK if not already loaded
    if (!(window as any).FB) {
      const existingScript = document.getElementById("facebook-jssdk");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "facebook-jssdk";
        script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v21.0";
        script.async = true;
        script.defer = true;
        script.crossOrigin = "anonymous";
        document.body.appendChild(script);
      }

      // Wait for SDK to load, then parse
      const interval = setInterval(() => {
        if ((window as any).FB) {
          clearInterval(interval);
          (window as any).FB.XFBML.parse(containerRef.current);
        }
      }, 200);

      return () => clearInterval(interval);
    } else {
      // SDK already loaded, just parse
      setTimeout(() => {
        (window as any).FB?.XFBML?.parse(containerRef.current);
      }, 100);
    }
  }, [url]);

  const dataAttr = pluginType === "video" ? "data-href" : "data-href";
  const className = pluginType === "video" ? "fb-video" : "fb-post";

  return (
    <div ref={containerRef} className="mx-auto" style={{ maxWidth: 200 }}>
      <div
        className={className}
        data-href={url}
        data-width="200"
        data-show-text="true"
        {...(pluginType === "video" ? { "data-allowfullscreen": "true", "data-autoplay": "false" } : {})}
      />
    </div>
  );
};

/**
 * Twitter/X embed using the widgets.js SDK.
 */
const TwitterEmbed = ({ tweetUrl }: { tweetUrl: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const twttr = (window as any).twttr;

    const renderTweet = () => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";
      (window as any).twttr.widgets.createTweet(
        tweetUrl.match(/status\/(\d+)/)?.[1] || "",
        containerRef.current,
        { align: "center", conversation: "none", dnt: true }
      );
    };

    if (twttr?.widgets) {
      renderTweet();
    } else {
      const existingScript = document.getElementById("twitter-wjs");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "twitter-wjs";
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        document.body.appendChild(script);
      }

      const interval = setInterval(() => {
        if ((window as any).twttr?.widgets) {
          clearInterval(interval);
          renderTweet();
        }
      }, 200);

      return () => clearInterval(interval);
    }
  }, [tweetUrl]);

  return (
    <div className="flex justify-center">
      <div ref={containerRef} style={{ maxWidth: 550, width: "100%" }} />
    </div>
  );
};


const UrlEmbed = ({ platform, url }: { platform: string; url: string }) => {
  // YouTube
  if (platform === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = getYouTubeId(url);
    if (videoId) {
      return (
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-lg"
          />
        </div>
      );
    }
  }

  // Spotify
  if (platform === "spotify" || url.includes("spotify.com")) {
    const path = getSpotifyPath(url);
    if (path) {
      const isEpisodeOrShow = path.startsWith("episode") || path.startsWith("show");
      return (
        <iframe
          src={`https://open.spotify.com/embed/${path}?utm_source=generator&theme=0`}
          width="100%"
          height={isEpisodeOrShow ? 232 : 152}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-lg"
          style={{ border: 0 }}
        />
      );
    }
  }

  // Facebook – only standard post/video URLs work with the embed plugin.
  // Share links (/share/...) must be resolved to their canonical reel/video URLs first.
  if (platform === "facebook" || url.includes("facebook.com")) {
    const isEmbeddable = /facebook\.com\/(?:[\w.]+\/(?:posts|videos|photos)|permalink\.php|watch\/|reel\/)/.test(url);

    if (isEmbeddable) {
      const isVideo = url.includes("/videos/") || url.includes("/watch") || url.includes("/reel/");
      const pluginType = isVideo ? "video" : "post";
      const pluginUrl = `https://www.facebook.com/plugins/${pluginType}.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
      return (
        <div className="flex justify-center">
          <iframe
            src={pluginUrl}
            width="500"
            height={isVideo ? 600 : 500}
            style={{ border: "none", overflow: "hidden", maxWidth: "100%" }}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }

    // Non-embeddable Facebook URL — show a styled card with link
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 text-sm hover:no-underline font-body p-4 rounded-lg transition-colors border border-border bg-muted/30 hover:bg-muted/50"
      >
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] text-white flex-shrink-0">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </span>
        <div className="flex flex-col min-w-0">
          <span className="font-heading font-semibold text-foreground">View on Facebook</span>
          <span className="text-xs text-muted-foreground truncate">{url}</span>
        </div>
        <svg className="h-4 w-4 ml-auto flex-shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    );
  }

  // Instagram – iframe embed using /p/{shortcode}/embed or /reel/{id}/embed
  if (platform === "instagram" || url.includes("instagram.com")) {
    const shortcode = getInstagramShortcode(url);
    if (shortcode) {
      const embedType = url.includes("/reel/") ? "reel" : url.includes("/tv/") ? "tv" : "p";
      return (
        <div className="flex justify-center">
          <iframe
            src={`https://www.instagram.com/${embedType}/${shortcode}/embed`}
            width="400"
            height="520"
            style={{ border: "none", overflow: "hidden", maxWidth: "100%", borderRadius: 12 }}
            allow="encrypted-media"
            allowFullScreen
            loading="lazy"
            title="Instagram embed"
          />
        </div>
      );
    }
  }

  // TikTok – iframe embed using /embed/v3/{videoId}
  if (platform === "tiktok" || url.includes("tiktok.com")) {
    const videoId = getTikTokVideoId(url);
    if (videoId) {
      return (
        <div className="flex justify-center">
          <iframe
            src={`https://www.tiktok.com/embed/v3/${videoId}`}
            width="340"
            height="700"
            style={{ border: "none", overflow: "hidden", maxWidth: "100%", borderRadius: 12 }}
            allow="encrypted-media"
            allowFullScreen
            loading="lazy"
            title="TikTok embed"
          />
        </div>
      );
    }
  }

  // Twitter/X – use widgets.js SDK to render tweet
  if (platform === "twitter" || url.includes("twitter.com") || url.includes("x.com")) {
    const tweetUrl = getTwitterTweetUrl(url);
    if (tweetUrl) {
      return <TwitterEmbed tweetUrl={tweetUrl} />;
    }
  }

  // Fallback: show a styled link
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 text-sm text-primary hover:underline font-body p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
    >
      <span className="uppercase font-bold text-xs bg-primary/10 text-primary px-2.5 py-1 rounded">
        {platform}
      </span>
      <span className="truncate">{url}</span>
      <svg className="h-4 w-4 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
};

/**
 * Renders raw embed_code HTML and executes any <script> tags within it.
 */
const RawEmbedCode = ({ html }: { html: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || loaded) return;

    // Clear and insert HTML
    containerRef.current.innerHTML = html;

    // Find and execute script tags
    const scripts = containerRef.current.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      // Copy attributes
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      // Copy inline script content
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    setLoaded(true);
  }, [html, loaded]);

  return <div ref={containerRef} className="social-embed-container" />;
};

/**
 * Main component that decides how to render a social embed.
 */
const SocialEmbedRenderer = ({ platform, embed_url, embed_code }: SocialEmbedProps) => {
  const initialUrl = embed_url?.trim() ? cleanFacebookUrl(embed_url.trim()) : null;
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(initialUrl);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const nextUrl = embed_url?.trim() ? cleanFacebookUrl(embed_url.trim()) : null;
    setResolvedUrl(nextUrl);

    if (!nextUrl || platform !== "facebook" || !isFacebookShareUrl(nextUrl)) {
      setIsResolving(false);
      return;
    }

    const resolveFacebookUrl = async () => {
      setIsResolving(true);
      try {
        const { data, error } = await supabase.functions.invoke("resolve-facebook-url", {
          body: { url: nextUrl },
        });

        if (error) throw error;
        if (cancelled) return;

        const canonicalUrl = typeof data?.resolved_url === "string"
          ? cleanFacebookUrl(data.resolved_url)
          : nextUrl;

        setResolvedUrl(canonicalUrl);
      } catch {
        if (!cancelled) setResolvedUrl(nextUrl);
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    };

    resolveFacebookUrl();

    return () => {
      cancelled = true;
    };
  }, [platform, embed_url]);

  // Prefer embed_code (raw HTML) when available
  if (embed_code && embed_code.trim()) {
    return (
      <div className="border border-border rounded-lg p-4 bg-muted/30 overflow-hidden">
        <RawEmbedCode html={embed_code} />
      </div>
    );
  }

  // URL-based embed
  if (resolvedUrl && resolvedUrl.trim()) {
    return (
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        {isResolving ? (
          <div className="text-sm text-muted-foreground font-body">Loading Facebook embed…</div>
        ) : (
          <UrlEmbed platform={platform} url={resolvedUrl} />
        )}
      </div>
    );
  }

  return null;
};

export default SocialEmbedRenderer;
