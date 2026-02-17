import type { NewsArticle } from "@/data/newsData";

interface NewsCardProps {
  article: NewsArticle;
}

const NewsCard = ({ article }: NewsCardProps) => {
  return (
    <article className="group rounded-lg overflow-hidden bg-card shadow-card hover:shadow-card-hover hover:scale-[1.02] transition-all duration-300 cursor-pointer">
      <div className="relative overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 bg-news-badge text-news-badge-foreground text-xs font-body font-bold px-3 py-1 rounded">
          {article.category}
        </span>
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
