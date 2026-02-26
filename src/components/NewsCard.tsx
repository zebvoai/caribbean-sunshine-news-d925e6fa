import { useState } from "react";
import type { NewsArticle } from "@/data/newsData";

interface NewsCardProps {
  article: NewsArticle;
  isBreaking?: boolean;
}

const NewsCard = ({ article, isBreaking }: NewsCardProps) => {
  const [imgError, setImgError] = useState(false);

  return (
    <article className="group bg-card rounded overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer flex flex-col h-full">
      <div className="relative overflow-hidden">
        {!imgError && article.image ? (
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-48 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm font-body">No image</span>
          </div>
        )}
        <div className="absolute top-0 left-0 flex gap-1.5 p-3">
          {isBreaking && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
              Breaking
            </span>
          )}
          <span className="bg-primary text-primary-foreground text-[10px] font-body font-bold px-2.5 py-1 rounded uppercase tracking-wider">
            {article.category}
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-heading font-bold text-base leading-snug text-card-foreground mb-2 line-clamp-3 group-hover:text-accent transition-colors">
          {article.title}
        </h3>
        <p className="text-muted-foreground text-sm font-body leading-relaxed mb-4 line-clamp-2 flex-1">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-body pt-3 border-t border-border mt-auto">
          <span className="font-semibold text-foreground">{article.source}</span>
          <span className="text-border">|</span>
          <span>{article.date}</span>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
