import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { NewsArticle } from "@/data/newsData";
import { buildImageCandidates } from "@/lib/networkProxy";

export interface NewsCardProps {
  article: NewsArticle;
  isBreaking?: boolean;
  isLiveEnded?: boolean;
  variant?: "default" | "hero" | "compact";
  /** True for the single above-the-fold LCP image on the page. */
  priority?: boolean;
}

const NewsCard = ({ article, isBreaking, isLiveEnded, variant = "default", priority = false }: NewsCardProps) => {
  const raw = article.image?.trim() ?? "";

  // Ordered fallbacks: WebP transform → same-origin proxy → direct storage URL.
  // Prevents a transient proxy 502 from permanently showing "No image".
  const candidates = useMemo(() => {
    if (variant === "hero") return buildImageCandidates(raw, { width: 1200, format: "webp", quality: 78 });
    if (variant === "compact") return buildImageCandidates(raw, { width: 240, height: 240, format: "webp", quality: 72 });
    return buildImageCandidates(raw, { width: 800, format: "webp", quality: 75 });
  }, [raw, variant]);

  const [attempt, setAttempt] = useState(0);
  const src = candidates[attempt] || "";
  const exhausted = candidates.length === 0 || attempt >= candidates.length;

  const handleError = useCallback(() => setAttempt((n) => n + 1), []);

  // Category-aware, descriptive alt text — better for SEO and structured data
  // than raw titles alone. Falls back gracefully when metadata is missing.
  const cat = (article.category || "News").trim();
  const catLabel = /news$/i.test(cat) ? cat : `${cat} news`;
  const title = (article.title || "").trim();
  const altText = title
    ? `${title} — ${catLabel} from Dominica News${isBreaking ? " (breaking)" : ""}`
    : `${catLabel} from Dominica News`;

  useEffect(() => {
    setAttempt(0);
  }, [raw, variant]);


  if (variant === "hero") {
    return (
      <article className="group relative bg-card rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-700 cursor-pointer card-lift">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-0">
          <div className="relative overflow-hidden aspect-[4/3] md:aspect-auto md:min-h-[440px]">
            {!exhausted && src ? (
              <img
                src={src}
                alt={altText}
                width={1200}
                height={800}
                loading={priority ? "eager" : "eager"}
                fetchPriority={priority ? "high" : "auto"}
                decoding={priority ? "sync" : "async"}
                referrerPolicy="no-referrer"
                onError={handleError}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[1200ms] ease-out"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm font-body">Featured Story</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent md:bg-gradient-to-l" />
          </div>
          <div className="p-7 md:p-12 flex flex-col justify-center relative">
            <div className="flex items-center gap-2 mb-5">
              {isBreaking && (
                <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.15em] animate-pulse shadow-sm">
                  Breaking
                </span>
              )}
              <span className="bg-primary/8 text-primary text-[9px] font-body font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.15em] border border-primary/15">
                {article.category}
              </span>
            </div>
            <h3 className="font-heading font-extrabold text-xl md:text-[2rem] leading-[1.15] text-card-foreground mb-5 group-hover:text-primary transition-colors duration-500 line-clamp-3">
              {article.title}
            </h3>
            <p className="text-muted-foreground text-sm md:text-[15px] font-body leading-[1.7] mb-8 line-clamp-3">
              {article.excerpt}
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
                <span className="font-semibold text-foreground">{article.source}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{article.date}</span>
              </div>
              <span className="flex items-center gap-1 text-xs font-body font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                Read <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group flex gap-4 items-start cursor-pointer py-3.5">
        <div className="relative overflow-hidden rounded-xl flex-shrink-0 w-24 h-24 shadow-sm">
          {!exhausted && src ? (
            <img
              src={src}
              alt={altText}
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={handleError}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-primary text-[9px] font-body font-bold uppercase tracking-[0.15em]">
            {article.category}
          </span>
          <h3 className="font-heading font-bold text-sm leading-snug text-card-foreground mt-1.5 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          <span className="text-[11px] text-muted-foreground font-body mt-1.5 block">{article.date}</span>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-500 cursor-pointer flex flex-col h-full card-lift border border-border/40">
      <div className="relative overflow-hidden">
        {!exhausted && src ? (
          <img
            src={src}
            alt={altText}
            width={800}
            height={500}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={handleError}
            className="w-full aspect-[16/10] object-cover group-hover:scale-[1.06] transition-transform duration-[800ms] ease-out"
          />
        ) : (
          <div className="w-full aspect-[16/10] bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs font-body">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
        <div className="absolute top-0 left-0 flex gap-1.5 p-3.5">
          {isBreaking && (
            <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-[0.12em] shadow-md">
              Breaking
            </span>
          )}
          {isLiveEnded && (
            <span className="bg-muted/90 text-muted-foreground text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-[0.12em] backdrop-blur-sm">
              Live · Ended
            </span>
          )}
        </div>
        <div className="absolute bottom-3.5 left-3.5">
          <span className="bg-primary text-primary-foreground text-[9px] font-body font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.12em] shadow-md">
            {article.category}
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading font-bold text-[15px] leading-[1.35] text-card-foreground mb-2.5 line-clamp-3 group-hover:text-primary transition-colors duration-300">
          {article.title}
        </h3>
        <p className="text-muted-foreground text-[13px] font-body leading-relaxed mb-4 line-clamp-2 flex-1">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground font-body pt-3.5 border-t border-border/40 mt-auto">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-foreground">{article.source}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{article.date}</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transform translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300" />
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
