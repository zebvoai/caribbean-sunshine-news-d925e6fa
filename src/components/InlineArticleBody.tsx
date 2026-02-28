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
const InlineArticleBody = ({ html, className, style }: InlineArticleBodyProps) => {
  const segments = useMemo(() => {
    if (!html) return [{ type: "html" as const, content: "" }];

    // Match any div that contains data-embed-platform (attribute order independent)
    const embedRegex = /<div[^>]*data-embed-platform="[^"]*"[^>]*>[\s\S]*?<\/div>/gi;

    const extractAttr = (tag: string, name: string): string => {
      const m = tag.match(new RegExp(`${name}="([^"]*)"`));
      return m ? m[1] : "";
    };

    const result: Array<
      | { type: "html"; content: string }
      | { type: "embed"; platform: string; url: string; code: string }
    > = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = embedRegex.exec(html)) !== null) {
      // Add HTML before this embed
      if (match.index > lastIndex) {
        result.push({ type: "html", content: html.slice(lastIndex, match.index) });
      }

      const tag = match[0];
      const platform = extractAttr(tag, "data-embed-platform");
      const url = (extractAttr(tag, "data-embed-url") || "").replace(/&quot;/g, '"');
      let code = "";
      try {
        const rawCode = extractAttr(tag, "data-embed-code");
        code = rawCode ? atob(rawCode) : "";
      } catch {
        code = "";
      }

      result.push({ type: "embed", platform, url, code });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining HTML after last embed
    if (lastIndex < html.length) {
      result.push({ type: "html", content: html.slice(lastIndex) });
    }

    // If no embeds found, return the full HTML as a single segment
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
