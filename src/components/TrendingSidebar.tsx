import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import type { NewsArticle } from "@/data/newsData";
import { getProxiedAssetUrl } from "@/lib/networkProxy";

interface TrendingItem extends NewsArticle {
  slug: string;
}

const TrendingSidebar = ({ articles }: { articles: TrendingItem[] }) => {
  if (!articles.length) return null;

  return (
    <aside className="space-y-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-heading font-bold uppercase tracking-widest text-foreground">
          Trending
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="space-y-0 divide-y divide-border/60">
        {articles.slice(0, 5).map((article, i) => {
          const imgSrc = getProxiedAssetUrl(article.image?.trim() ?? "");
          return (
            <Link
              key={article.slug}
              to={`/news/${article.slug}`}
              className="group flex gap-3 py-4 first:pt-0 last:pb-0"
            >
              <span className="text-3xl font-heading font-black text-primary/20 group-hover:text-primary/40 transition-colors leading-none flex-shrink-0 w-8">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-body font-bold text-primary uppercase tracking-wider">
                  {article.category}
                </span>
                <h3 className="font-heading font-bold text-[13px] leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-0.5">
                  {article.title}
                </h3>
                <span className="text-[11px] text-muted-foreground font-body mt-1 block">
                  {article.date}
                </span>
              </div>
              {imgSrc && (
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={imgSrc}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default TrendingSidebar;
