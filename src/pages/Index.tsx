import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: breakingRaw = [], isLoading: loadingBreaking } = useQuery({
    queryKey: ["articles", "breaking"],
    queryFn: () => mongoApi.getArticles({ status: "published", limit: 2, is_breaking: true }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !activeCat,
  });

  const { data: liveUpdates = [], isLoading: loadingLive } = useQuery({
    queryKey: ["live-updates-home"],
    queryFn: () => mongoApi.getLiveUpdates(),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !activeCat,
  });

  const activeLiveUpdates = liveUpdates.filter((u) => u.is_live);
  const endedLiveUpdates = liveUpdates.filter((u) => !u.is_live);

  const mappedArticles = articles.map((a) => ({ ...toNewsArticle(a), is_breaking: a.is_breaking }));
  const breakingArticles = breakingRaw.filter((a) => a.is_breaking).map(toBreakingArticle);

  const endedLiveAsCards = endedLiveUpdates.map((u) => ({
    id: 0,
    title: u.title,
    excerpt: u.excerpt || "",
    category: "Live Update",
    source: "Dominica News",
    date: u.updated_at
      ? `Ended ${formatDistanceToNow(new Date(u.updated_at), { addSuffix: true })}`
      : "",
    image: getProxiedAssetUrl(u.cover_image_url || ""),
    slug: u.slug,
    is_breaking: false,
    is_live_update: true,
  }));

  const sectionTitle = activeCat
    ? activeCat.charAt(0).toUpperCase() + activeCat.slice(1)
    : "Latest News";

  // First article for hero, rest for grid
  const heroArticle = !activeCat && mappedArticles.length > 0 ? mappedArticles[0] : null;
  const gridArticles = !activeCat ? mappedArticles.slice(1) : mappedArticles;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* Live Updates Section — only on home */}
        {!activeCat && (loadingLive ? (
          <section className="space-y-3">
            <SectionHeader title="Live Updates" variant="live" loading />
            <div className="h-20 bg-muted animate-pulse rounded-xl" />
          </section>
        ) : activeLiveUpdates.length > 0 ? (
          <section>
            <SectionHeader title="Live Updates" variant="live" />
            <div className="space-y-3">
              {activeLiveUpdates.map((u) => (
                <Link key={u.id} to={`/live/${u.slug}`} className="block group">
                  <div className="flex gap-4 items-start bg-card rounded-xl p-4 border border-destructive/20 hover:border-destructive/40 hover:shadow-card-hover transition-all duration-200">
                    {u.cover_image_url && (
                      <img
                        src={getProxiedAssetUrl(u.cover_image_url)}
                        alt={u.cover_image_alt || u.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.dataset.fallbackApplied === "true") { img.style.display = "none"; return; }
                          img.dataset.fallbackApplied = "true";
                          img.src = "/placeholder.svg";
                        }}
                        className="w-36 h-24 object-cover rounded-lg flex-shrink-0 group-hover:opacity-90 transition-opacity"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center gap-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
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
        ) : null)}

        {/* Breaking News Section — only on home */}
        {!activeCat && (loadingBreaking ? (
          <section className="space-y-3">
            <SectionHeader title="Breaking News" variant="breaking" loading />
            <div className="h-28 bg-muted animate-pulse rounded-xl" />
          </section>
        ) : breakingArticles.length > 0 ? (
          <section>
            <SectionHeader title="Breaking News" variant="breaking" />
            <div className="space-y-3">
              {breakingArticles.map((a) => (
                <Link key={a.id} to={`/news/${a.slug}`} className="block group">
                  <div className="flex gap-4 items-start bg-card rounded-xl p-4 border border-destructive/20 hover:border-destructive/40 hover:shadow-card-hover transition-all duration-200">
                    {a.cover_image_url && (
                      <img
                        src={a.cover_image_url}
                        alt={a.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.dataset.fallbackApplied === "true") { img.style.display = "none"; return; }
                          img.dataset.fallbackApplied = "true";
                          img.src = "/placeholder.svg";
                        }}
                        className="w-36 h-24 object-cover rounded-lg flex-shrink-0 group-hover:opacity-90 transition-opacity"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-block bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
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
        ) : null)}

        {/* Articles Section */}
        <section>
          <SectionHeader title={sectionTitle} variant="default" />

          {loadingArticles ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl bg-muted animate-pulse h-80" />
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
            <div className="space-y-8">
              {/* Hero card for first article on home */}
              {heroArticle && (
                <Link to={`/news/${heroArticle.slug}`} className="block">
                  <NewsCard article={heroArticle} isBreaking={heroArticle.is_breaking} variant="hero" />
                </Link>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Ended live updates shown first */}
                {!activeCat && endedLiveAsCards.map((card) => (
                  <Link key={`live-${card.slug}`} to={`/live/${card.slug}`} className="block">
                    <NewsCard article={card} isLiveEnded />
                  </Link>
                ))}
                {gridArticles.map((article) => (
                  <Link key={article.slug} to={`/news/${article.slug}`} className="block">
                    <NewsCard article={article} isBreaking={article.is_breaking} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

/* ── Section Header component ──────────────────────────────────── */
const SectionHeader = ({
  title,
  variant = "default",
  loading,
}: {
  title: string;
  variant?: "default" | "live" | "breaking";
  loading?: boolean;
}) => {
  const isAlert = variant === "live" || variant === "breaking";

  if (loading) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-muted animate-pulse" />
        <div className="h-5 w-36 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (isAlert) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <h2 className="text-sm font-heading font-bold text-destructive uppercase tracking-widest">
            {title}
          </h2>
        </div>
        <div className="h-px bg-destructive/30" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="text-2xl font-heading font-bold text-foreground">{title}</h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
};

export default Index;
