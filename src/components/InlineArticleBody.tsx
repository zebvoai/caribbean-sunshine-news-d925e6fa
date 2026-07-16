import { useMemo } from "react";
import SocialEmbedRenderer from "@/components/SocialEmbedRenderer";
import { applyEntityLinks, ensureImageAlts, extractHeadings, injectHeadingIds, countWords } from "@/lib/entityLinker";

interface InlineArticleBodyProps {
  html: string;
  className?: string;
  style?: React.CSSProperties;
  /** Apply automatic in-body entity linking (people, events, obituaries). Default true. */
  linkEntities?: boolean;
  /** If provided, fills empty/missing alt on any <img> with this string (usually the article title). */
  imageAltFallback?: string;
  /** If true (default), injects a Table of Contents above the body when the article is >= 700 words and has ≥3 headings. */
  showToc?: boolean;
}

/**
 * Renders article body HTML with inline social embeds.
 * Splits the body at `<div data-embed-platform="...">` placeholders
 * and renders SocialEmbedRenderer components inline between text chunks.
 */
const PLATFORM_NAMES = ["instagram", "twitter", "youtube", "tiktok", "spotify", "facebook"];

const InlineArticleBody = ({
  html: rawHtml,
  className,
  style,
  linkEntities = true,
  imageAltFallback,
  showToc = true,
}: InlineArticleBodyProps) => {
  const html = useMemo(() => {
    let out = rawHtml || "";
    if (imageAltFallback) out = ensureImageAlts(out, imageAltFallback);
    if (linkEntities) out = applyEntityLinks(out);
    return out;
  }, [rawHtml, linkEntities, imageAltFallback]);

  const { htmlWithIds, headings, wordCount } = useMemo(() => {
    const wc = countWords(html);
    if (!showToc || wc < 700) return { htmlWithIds: html, headings: [], wordCount: wc };
    const hs = extractHeadings(html);
    if (hs.length < 3) return { htmlWithIds: html, headings: [], wordCount: wc };
    return { htmlWithIds: injectHeadingIds(html, hs), headings: hs, wordCount: wc };
  }, [html, showToc]);

  const segments = useMemo(() => {
    const src = htmlWithIds;
    if (!src) return [{ type: "html" as const, content: "" }];

    const extractAttr = (tag: string, name: string): string => {
      const m = tag.match(new RegExp(`${name}="([^"]*)"`));
      return m ? m[1] : "";
    };

    const attrPattern = `<div[^>]*data-embed-platform="[^"]*"[^>]*>[\\s\\S]*?<\\/div>`;
    const platformAlts = PLATFORM_NAMES.join("|");
    const plainPattern = `<p[^>]*>\\s*📎\\s*<strong>(${platformAlts})<\\/strong>\\s*embed:\\s*(?:<a[^>]*>\\s*)?(https?:\\/\\/[^<\\s]+?)(?:\\s*<\\/a>)?\\s*<\\/p>`;
    const combinedRegex = new RegExp(`(?:${attrPattern})|(?:${plainPattern})`, "gi");

    const result: Array<
      | { type: "html"; content: string }
      | { type: "embed"; platform: string; url: string; code: string }
    > = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = combinedRegex.exec(src)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: "html", content: src.slice(lastIndex, match.index) });
      }

      const tag = match[0];
      let platform = "";
      let url = "";
      let code = "";

      if (tag.includes("data-embed-platform")) {
        platform = extractAttr(tag, "data-embed-platform");
        url = (extractAttr(tag, "data-embed-url") || "").replace(/&quot;/g, '"');
        try {
          const rawCode = extractAttr(tag, "data-embed-code");
          code = rawCode ? atob(rawCode) : "";
        } catch {
          code = "";
        }
      } else {
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

    if (lastIndex < src.length) {
      result.push({ type: "html", content: src.slice(lastIndex) });
    }

    if (result.length === 0) {
      result.push({ type: "html", content: src });
    }

    return result;
  }, [htmlWithIds]);

  const toc = headings.length > 0 && (
    <nav
      aria-label="Table of contents"
      className="not-prose mb-8 rounded-2xl border border-border/60 bg-muted/40 p-5"
    >
      <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-primary mb-3">
        In this article
      </p>
      <ol className="space-y-1.5 text-sm font-body">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-4" : ""}>
            <a href={`#${h.id}`} className="text-foreground/85 hover:text-primary hover:underline underline-offset-4">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );

  const hasEmbeds = segments.some((s) => s.type === "embed");
  if (!hasEmbeds) {
    return (
      <>
        {toc}
        <div
          className={className}
          style={style}
          dangerouslySetInnerHTML={{ __html: htmlWithIds }}
        />
      </>
    );
  }

  return (
    <div style={style}>
      {toc}
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
