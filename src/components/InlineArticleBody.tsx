import { useMemo } from "react";
import SocialEmbedRenderer from "@/components/SocialEmbedRenderer";

interface InlineArticleBodyProps {
  html: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders article body HTML with inline social embeds.
 * Splits the body at `<div data-embed-platform="...">` placeholders
 * and renders SocialEmbedRenderer components inline between text chunks.
 */
const PLATFORM_NAMES = ["instagram", "twitter", "youtube", "tiktok", "spotify", "facebook"];

const InlineArticleBody = ({ html, className, style }: InlineArticleBodyProps) => {
  const segments = useMemo(() => {
    if (!html) return [{ type: "html" as const, content: "" }];

    const extractAttr = (tag: string, name: string): string => {
      const m = tag.match(new RegExp(`${name}="([^"]*)"`));
      return m ? m[1] : "";
    };

    // Pattern 1: div with data-embed-platform attribute (ideal format)
    const attrPattern = `<div[^>]*data-embed-platform="[^"]*"[^>]*>[\\s\\S]*?<\\/div>`;

    // Pattern 2: TipTap-stripped plain-text format (p or div containing 📎 <strong>PLATFORM</strong> embed: URL)
    const platformAlts = PLATFORM_NAMES.join("|");
    const plainPattern = `<p[^>]*>\\s*📎\\s*<strong>(${platformAlts})<\\/strong>\\s*embed:\\s*(https?:\\/\\/[^<\\s]+)\\s*<\\/p>`;

    const combinedRegex = new RegExp(`(?:${attrPattern})|(?:${plainPattern})`, "gi");

    const result: Array<
      | { type: "html"; content: string }
      | { type: "embed"; platform: string; url: string; code: string }
    > = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = combinedRegex.exec(html)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: "html", content: html.slice(lastIndex, match.index) });
      }

      const tag = match[0];
      let platform = "";
      let url = "";
      let code = "";

      if (tag.includes("data-embed-platform")) {
        // Pattern 1: data-attribute based
        platform = extractAttr(tag, "data-embed-platform");
        url = (extractAttr(tag, "data-embed-url") || "").replace(/&quot;/g, '"');
        try {
          const rawCode = extractAttr(tag, "data-embed-code");
          code = rawCode ? atob(rawCode) : "";
        } catch {
          code = "";
        }
      } else {
        // Pattern 2: plain-text fallback — captured groups from the plain pattern
        // Re-extract since combined regex groups may shift
        const plainMatch = tag.match(new RegExp(`<strong>(${platformAlts})<\\/strong>\\s*embed:\\s*(https?:\\/\\/[^<\\s]+)`, "i"));
        if (plainMatch) {
          platform = plainMatch[1].toLowerCase();
          url = plainMatch[2];
        }
      }

      if (platform) {
        result.push({ type: "embed", platform, url, code });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < html.length) {
      result.push({ type: "html", content: html.slice(lastIndex) });
    }

    if (result.length === 0) {
      result.push({ type: "html", content: html });
    }

    return result;
  }, [html]);

  // If no inline embeds, render as a single block for performance
  const hasEmbeds = segments.some((s) => s.type === "embed");
  if (!hasEmbeds) {
    return (
      <div
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div style={style}>
      {segments.map((segment, idx) => {
        if (segment.type === "html") {
          return segment.content.trim() ? (
            <div
              key={idx}
              className={className}
              dangerouslySetInnerHTML={{ __html: segment.content }}
            />
          ) : null;
        }

        return (
          <div key={idx} className="my-6">
            <SocialEmbedRenderer
              platform={segment.platform}
              embed_url={segment.url || null}
              embed_code={segment.code || null}
            />
          </div>
        );
      })}
    </div>
  );
};

export default InlineArticleBody;
