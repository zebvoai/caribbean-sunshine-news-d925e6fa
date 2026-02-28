import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import NewsCard from "@/components/NewsCard";
import SiteFooter from "@/components/SiteFooter";
import { mongoApi, MongoArticle, MongoLiveUpdate } from "@/lib/mongoApi";
import { getProxiedAssetUrl } from "@/lib/networkProxy";
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
  image: getProxiedAssetUrl(a.cover_image_url || ""),
  slug: a.slug,
});

const toBreakingArticle = (a: MongoArticle) => ({
  id: a.id,
  title: a.title,
  excerpt: a.excerpt,
  slug: a.slug,
  cover_image_url: getProxiedAssetUrl(a.cover_image_url || ""),
  published_at: a.published_at,
});

const Index = () => {
  const [searchParams] = useSearchParams();
  const activeCat = searchParams.get("cat");

  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ["articles", activeCat || "home"],
    queryFn: () => {
      const params: Parameters<typeof mongoApi.getArticles>[0] = {
        status: "published",
        limit: 12,
      };
      if (activeCat) params.category_slug = activeCat;
      return mongoApi.getArticles(params);
    },
    staleTime: 5 * 60 * 1000, // 5 min cache — instant tab switch
    gcTime: 10 * 60 * 1000,
  });

  const { data: breakingRaw = [] } = useQuery({
    queryKey: ["articles", "breaking"],
    queryFn: () => mongoApi.getArticles({ status: "published", limit: 2, is_breaking: true }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !activeCat,
  });

  const { data: liveUpdates = [] } = useQuery({
    queryKey: ["live-updates-home"],
    queryFn: () => mongoApi.getLiveUpdates(),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !activeCat,
  });

  const activeLiveUpdates = liveUpdates.filter((u) => u.is_live);

  const mappedArticles = articles.map((a) => ({ ...toNewsArticle(a), is_breaking: a.is_breaking }));
  const breakingArticles = breakingRaw.filter((a) => a.is_breaking).map(toBreakingArticle);

  const sectionTitle = activeCat
    ? activeCat.charAt(0).toUpperCase() + activeCat.slice(1)
    : "Latest News";


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Live Updates Section — only on home */}
        {!activeCat && activeLiveUpdates.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              <h2 className="text-lg font-heading font-bold text-destructive uppercase tracking-wider">
                Live Updates
              </h2>
            </div>
            <div className="border-b-2 border-destructive mb-4" />
            <div className="space-y-4">
              {activeLiveUpdates.map((u) => (
                <Link key={u.id} to={`/news/${u.slug}`} className="block group">
                  <div className="flex gap-4 items-start">
                    {u.cover_image_url && (
                      <img
                        src={getProxiedAssetUrl(u.cover_image_url)}
                        alt={u.cover_image_alt || u.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.dataset.fallbackApplied === "true") {
                            img.style.display = "none";
                            return;
                          }
                          img.dataset.fallbackApplied = "true";
                          img.src = "/placeholder.svg";
                        }}
                        className="w-40 h-28 object-cover rounded-lg flex-shrink-0 group-hover:opacity-90 transition-opacity"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center gap-1 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground animate-pulse" />
                          LIVE
                        </span>
                        {u.updated_at && (
                          <span className="text-xs text-muted-foreground">
                            Updated {new Date(u.updated_at).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading font-bold text-lg leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {u.title}
                      </h3>
                      {u.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 font-body">{u.excerpt}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Breaking News Section — only on home */}
        {!activeCat && !loadingArticles && breakingArticles.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              <h2 className="text-lg font-heading font-bold text-destructive uppercase tracking-wider">
                Breaking News
              </h2>
            </div>
            <div className="border-b-2 border-destructive mb-4" />
            <div className="space-y-4">
              {breakingArticles.map((a) => (
                <Link key={a.id} to={`/news/${a.slug}`} className="block group">
                  <div className="flex gap-4 items-start">
                    {a.cover_image_url && (
                      <img
                        src={a.cover_image_url}
                        alt={a.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.dataset.fallbackApplied === "true") {
                            img.style.display = "none";
                            return;
                          }
                          img.dataset.fallbackApplied = "true";
                          img.src = "/placeholder.svg";
                        }}
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

        {/* Articles Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-heading font-bold text-foreground">{sectionTitle}</h2>
            <div className="flex-1 h-px bg-border" />
          </div>

          {loadingArticles ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-lg bg-muted animate-pulse h-72" />
              ))}
            </div>
          ) : mappedArticles.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground font-body">
              <p className="text-lg mb-3">No articles in this category yet.</p>
              <Link to="/admin/articles/create" className="text-primary hover:underline text-sm">
                Publish the first article →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mappedArticles.map((article) => (
                <Link key={article.slug} to={`/news/${article.slug}`} className="block">
                  <NewsCard article={article} isBreaking={article.is_breaking} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
