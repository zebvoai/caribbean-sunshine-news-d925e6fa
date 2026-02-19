import type { NewsArticle } from "@/data/newsData";

interface NewsCardProps {
  article: NewsArticle;
  isBreaking?: boolean;
}

const NewsCard = ({ article, isBreaking }: NewsCardProps) => {
  return (
    <article className="group rounded-lg overflow-hidden bg-card shadow-card hover:shadow-card-hover hover:scale-[1.02] transition-all duration-300 cursor-pointer">
      <div className="relative overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          loading="lazy"
          decoding="async"
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {isBreaking && (
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Breaking
            </span>
          )}
          <span className="bg-news-badge text-news-badge-foreground text-xs font-body font-bold px-3 py-1 rounded">
            {article.category}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-heading font-bold text-lg leading-snug text-card-foreground mb-2 line-clamp-3">
          {article.title}
        </h3>
        <p className="text-muted-foreground text-sm font-body leading-relaxed mb-4 line-clamp-2">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
          <span className="font-semibold">{article.source}</span>
          <span>•</span>
          <span>{article.date}</span>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
