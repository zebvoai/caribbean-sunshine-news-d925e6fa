import { useEffect, useRef, useState } from "react";

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
    <div ref={containerRef}>
      <div
        className={className}
        data-href={url}
        data-width="auto"
        data-show-text="true"
        {...(pluginType === "video" ? { "data-allowfullscreen": "true", "data-autoplay": "false" } : {})}
      />
    </div>
  );
};

/**
 * Renders a URL-based embed for supported platforms using iframes.
 */
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

  // Facebook – use an iframe to the post/video
  if (platform === "facebook" || url.includes("facebook.com")) {
    const isVideo = url.includes("/videos/") || url.includes("/watch") || url.includes("/reel");
    const pluginType = isVideo ? "video" : "post";
    // Use the Facebook SDK approach for better responsive rendering
    return <FacebookEmbed url={url} pluginType={pluginType} />;
  }

  // TikTok – link only (TikTok embeds require JS SDK)
  // Instagram – link only (Instagram embeds require JS SDK)
  // Twitter/X – link only (Twitter embeds require JS SDK)
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
  // Prefer embed_code (raw HTML) when available
  if (embed_code && embed_code.trim()) {
    return (
      <div className="border border-border rounded-lg p-4 bg-muted/30 overflow-hidden">
        <RawEmbedCode html={embed_code} />
      </div>
    );
  }

  // URL-based embed
  if (embed_url && embed_url.trim()) {
    return (
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <UrlEmbed platform={platform} url={embed_url} />
      </div>
    );
  }

  return null;
};

export default SocialEmbedRenderer;
