import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import NewsCard from "@/components/NewsCard";
import { mongoApi, MongoArticle } from "@/lib/mongoApi";
import type { NewsArticle } from "@/data/newsData";

const toNewsArticle = (a: MongoArticle): NewsArticle & { slug: string } => ({
  id: 0,
  title: a.title,
  excerpt: a.excerpt,
  category: a.categories?.name || "News",
  source: "Dominica News",
  date: a.published_at
    ? new Date(a.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "",
  image: a.cover_image_url || "",
  slug: a.slug,
});

const toBreakingArticle = (a: MongoArticle) => ({
  id: a.id,
  title: a.title,
  excerpt: a.excerpt,
  slug: a.slug,
  cover_image_url: a.cover_image_url,
  published_at: a.published_at,
});

const Index = () => {
  const [articles, setArticles] = useState<(NewsArticle & { slug: string; is_breaking?: boolean })[]>([]);
  const [breakingArticles, setBreakingArticles] = useState<ReturnType<typeof toBreakingArticle>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      mongoApi.getArticles({ status: "published", limit: 12 }),
      mongoApi.getArticles({ status: "published", limit: 5, is_breaking: true }),
    ])
      .then(([all, breaking]) => {
        setArticles(all.map((a) => ({ ...toNewsArticle(a), is_breaking: a.is_breaking })));
        setBreakingArticles(breaking.filter((a) => a.is_breaking).map(toBreakingArticle));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Breaking News Section */}
        {!loading && breakingArticles.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-destructive text-xl">🔥</span>
              <h2 className="text-2xl font-heading font-extrabold text-foreground tracking-wide uppercase">
                Breaking News
              </h2>
            </div>
            <div className="border-b-2 border-destructive mb-5" />
            <div className="space-y-4">
              {breakingArticles.map((a) => (
                <Link key={a.id} to={`/news/${a.slug}`} className="block group">
                  <div className="flex gap-4 items-start">
                    {a.cover_image_url && (
                      <img
                        src={a.cover_image_url}
                        alt={a.title}
                        className="w-40 h-28 object-cover rounded-lg flex-shrink-0 group-hover:opacity-90 transition-opacity"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-block bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                          Breaking
                        </span>
                        {a.published_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(a.published_at).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading font-bold text-lg leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {a.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 font-body">{a.excerpt}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Latest News Section */}
        <section>
          <h2 className="text-3xl font-heading font-bold text-foreground mb-6">Latest News</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-lg bg-muted animate-pulse h-72" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground font-body">
              <p className="text-lg mb-3">No articles published yet.</p>
              <Link to="/admin/articles/create" className="text-primary hover:underline text-sm">
                Publish the first article →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, idx) => (
                <Link key={idx} to={`/news/${article.slug}`} className="block">
                  <NewsCard article={article} isBreaking={article.is_breaking} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
