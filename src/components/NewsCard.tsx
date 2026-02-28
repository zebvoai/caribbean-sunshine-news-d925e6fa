import { useEffect, useState } from "react";
import type { NewsArticle } from "@/data/newsData";
import { getProxiedAssetUrl } from "@/lib/networkProxy";

export interface NewsCardProps {
  article: NewsArticle;
  isBreaking?: boolean;
  isLiveEnded?: boolean;
  variant?: "default" | "hero" | "compact";
}

const NewsCard = ({ article, isBreaking, isLiveEnded, variant = "default" }: NewsCardProps) => {
  const [imgError, setImgError] = useState(false);
  const safeImageSrc = getProxiedAssetUrl(article.image?.trim() ?? "");

  useEffect(() => {
    setImgError(false);
  }, [safeImageSrc]);

  if (variant === "hero") {
    return (
      <article className="group relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-500 cursor-pointer card-lift">
        <div className="grid md:grid-cols-[1.15fr_1fr] gap-0">
          <div className="relative overflow-hidden aspect-[4/3] md:aspect-auto md:min-h-[400px]">
            {!imgError && safeImageSrc ? (
              <img
                src={safeImageSrc}
                alt={article.title}
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              />
            ) : (
              <img src="/placeholder.svg" alt={`Placeholder for ${article.title}`} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
          <div className="p-6 md:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              {isBreaking && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  Breaking
                </span>
              )}
              <span className="bg-primary/10 text-primary text-[10px] font-body font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {article.category}
              </span>
            </div>
            <h3 className="font-heading font-bold text-xl md:text-[1.75rem] leading-[1.2] text-card-foreground mb-4 group-hover:text-primary transition-colors duration-300 line-clamp-3">
              {article.title}
            </h3>
            <p className="text-muted-foreground text-sm md:text-[15px] font-body leading-relaxed mb-6 line-clamp-3">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-body pt-5 border-t border-border mt-auto">
              <span className="font-semibold text-foreground">{article.source}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{article.date}</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group flex gap-4 items-start cursor-pointer py-3">
        <div className="relative overflow-hidden rounded-lg flex-shrink-0 w-24 h-24">
          {!imgError && safeImageSrc ? (
            <img
              src={safeImageSrc}
              alt={article.title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <img src="/placeholder.svg" alt={`Placeholder for ${article.title}`} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-primary text-[10px] font-body font-bold uppercase tracking-wider">
            {article.category}
          </span>
          <h3 className="font-heading font-bold text-sm leading-snug text-card-foreground mt-1 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          <span className="text-xs text-muted-foreground font-body mt-1 block">{article.date}</span>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer flex flex-col h-full card-lift">
      <div className="relative overflow-hidden">
        {!imgError && safeImageSrc ? (
          <img
            src={safeImageSrc}
            alt={article.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full aspect-[16/10] object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
        ) : (
          <img src="/placeholder.svg" alt={`Placeholder image for ${article.title}`} loading="lazy" decoding="async" className="w-full aspect-[16/10] object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
        <div className="absolute top-0 left-0 flex gap-1.5 p-3">
          {isBreaking && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Breaking
            </span>
          )}
          {isLiveEnded && (
            <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Live · Ended
            </span>
          )}
        </div>
        {/* Bottom-left category badge on image */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-primary text-primary-foreground text-[10px] font-body font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
            {article.category}
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading font-bold text-[15px] leading-snug text-card-foreground mb-2 line-clamp-3 group-hover:text-primary transition-colors duration-200">
          {article.title}
        </h3>
        <p className="text-muted-foreground text-sm font-body leading-relaxed mb-4 line-clamp-2 flex-1">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-body pt-3 border-t border-border/60 mt-auto">
          <span className="font-semibold text-foreground">{article.source}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{article.date}</span>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
