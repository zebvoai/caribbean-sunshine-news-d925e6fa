import { Link } from "react-router-dom";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import type { NewsArticle } from "@/data/newsData";
import { getProxiedAssetUrl } from "@/lib/networkProxy";

interface TrendingItem extends NewsArticle {
  slug: string;
}

const TrendingSidebar = ({ articles }: { articles: TrendingItem[] }) => {
  if (!articles.length) return null;

  return (
    <aside className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-heading font-bold uppercase tracking-[0.12em] text-foreground">
          Trending
        </h2>
      </div>

      <div className="space-y-0">
        {articles.slice(0, 5).map((article, i) => {
          const imgSrc = getProxiedAssetUrl(article.image?.trim() ?? "");
          return (
            <Link
              key={article.slug}
              to={`/news/${article.slug}`}
              className="group flex gap-3.5 py-4 border-b border-border/40 last:border-b-0 last:pb-0 first:pt-0"
            >
              <span className="text-[28px] font-heading font-black text-primary/15 group-hover:text-primary/35 transition-colors duration-300 leading-none flex-shrink-0 w-9 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-body font-bold text-primary uppercase tracking-[0.15em]">
                  {article.category}
                </span>
                <h3 className="font-heading font-bold text-[13px] leading-[1.4] text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 mt-1">
                  {article.title}
                </h3>
                <span className="text-[10px] text-muted-foreground font-body mt-1.5 flex items-center gap-1">
                  {article.date}
                  <ArrowUpRight className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>
              {imgSrc && (
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                  <img
                    src={imgSrc}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
