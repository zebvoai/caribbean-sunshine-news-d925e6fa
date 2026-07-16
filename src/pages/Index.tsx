import { Link, useSearchParams, useParams } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import NewsCard from "@/components/NewsCard";
import ArticleFAQ from "@/components/ArticleFAQ";
import SiteFooter from "@/components/SiteFooter";
import BreakingTicker from "@/components/BreakingTicker";
import TrendingSidebar from "@/components/TrendingSidebar";
import { mongoApi, MongoArticle } from "@/lib/mongoApi";
import { getProxiedAssetUrl, getOptimizedImageUrl } from "@/lib/networkProxy";
import type { NewsArticle } from "@/data/newsData";


const toNewsArticle = (a: MongoArticle): NewsArticle & { slug: string } => ({
  id: 0,
  title: a.title,
  excerpt: a.excerpt,
  category: a.categories?.name || "News",
  source: a.authors?.full_name || "Dominica News",
  date: a.published_at
    ? new Date(a.published_at).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Dominica",
      }) + " AST"
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

const CATEGORY_META: Record<string, { title: string; desc: string; heading: string; intro: string }> = {
  caribbean: {
    title: "Caribbean News | Dominica News",
    desc: "Latest Caribbean news, regional politics, CARICOM updates and stories from across the Caribbean — curated by Dominica News.",
    heading: "Caribbean News",
    intro:
      "Caribbean news from a Dominican perspective — CARICOM decisions, regional elections, hurricane response, cricket and cross-island stories that shape life in the Commonwealth of Dominica and its neighbours. Dominica News tracks headlines from Antigua, Barbados, St Lucia, Trinidad, Jamaica, Guyana and the wider region, updated throughout the day so readers on the Nature Isle stay informed on Caribbean affairs that matter at home.",
  },
  dominica: {
    title: "Dominica News: Latest Updates from the Nature Isle",
    desc: "All the latest news from the Commonwealth of Dominica — communities, government, culture and events from the Nature Isle.",
    heading: "Dominica News",
    intro:
      "Dominica news from across the Commonwealth of Dominica — Roseau to Portsmouth, Kalinago Territory to Marigot. Dominica News reports community stories, government announcements, business developments, culture and events every day from the Nature Isle, giving residents at home and the Dominican diaspora abroad a trusted independent source for what is happening in Dominica right now, with context on how each story affects daily life.",
  },
  news: {
    title: "Latest News | Dominica News",
    desc: "Breaking headlines and the latest news stories from Dominica and the Caribbean, updated throughout the day.",
    heading: "Latest News",
    intro:
      "Latest news in Dominica and breaking headlines from across the Caribbean, updated throughout the day by the Dominica News editorial team. Follow developing stories, official government statements, verified reports and eyewitness accounts from Roseau, Portsmouth and the wider Commonwealth of Dominica. This page brings together the newest articles from every section — politics, weather, community, business and Caribbean coverage — as they are published.",
  },
  politics: {
    title: "Dominica Politics News | Elections & Government",
    desc: "Dominica political news — elections, parliament, government policy, and political analysis from across the Commonwealth of Dominica.",
    heading: "Politics",
    intro:
      "Dominica politics news — general elections, parliamentary debate, government policy, DLP and UWP developments, cabinet decisions and diplomatic affairs. Dominica News delivers independent political coverage from the Commonwealth of Dominica, tracking statements from Prime Minister Roosevelt Skerrit, opposition leaders and civil society, with clear context on how each decision affects citizens, public services and Dominica's standing in the Caribbean and internationally.",
  },
  weather: {
    title: "Dominica Weather News | Hurricanes & Forecasts",
    desc: "Dominica weather updates, hurricane and tropical storm alerts, forecasts and climate coverage for the Nature Isle.",
    heading: "Weather",
    intro:
      "Dominica weather news — hurricane and tropical storm alerts, daily forecasts, marine warnings, flood advisories and long-term climate coverage for the Nature Isle. Dominica News sources updates from the Dominica Meteorological Service, ODM and regional monitoring agencies including the NHC, publishing storm bulletins and preparedness guidance as conditions change so residents across Roseau, Portsmouth and rural communities can plan and stay safe.",
  },
};


const Index = () => {
  const [searchParams] = useSearchParams();
  const routeParams = useParams();
  const activeCat = routeParams.slug || searchParams.get("cat");
  const ARTICLES_PER_PAGE = 12;

  const {
    data: articlesPages,
    isLoading: loadingArticles,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["articles-paged", activeCat || "home"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => {
      const params: Parameters<typeof mongoApi.getArticles>[0] = {
        status: "published",
        limit: ARTICLES_PER_PAGE,
        skip: pageParam as number,
      };
      if (activeCat) params.category_slug = activeCat;
      return mongoApi.getArticles(params);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < ARTICLES_PER_PAGE) return undefined;
      return allPages.reduce((acc, p) => acc + p.length, 0);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const articles: MongoArticle[] = articlesPages?.pages.flat() ?? [];

  const { data: breakingRaw = [] } = useQuery({
    queryKey: ["articles", "breaking"],
    queryFn: () => mongoApi.getArticles({ status: "published", limit: 5, is_breaking: true }),
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

  const catMeta = activeCat ? CATEGORY_META[activeCat.toLowerCase()] : null;
  const sectionTitle = catMeta?.heading
    ?? (activeCat ? activeCat.charAt(0).toUpperCase() + activeCat.slice(1) : "Latest News");

  const heroArticle = !activeCat && mappedArticles.length > 0 ? mappedArticles[0] : null;
  const gridArticles = !activeCat ? mappedArticles.slice(1) : mappedArticles;
  const trendingArticles = !activeCat ? mappedArticles.slice(1, 6) : [];

  const isCategory = !!activeCat;
  const pageTitle = catMeta?.title
    ?? (isCategory
      ? `${sectionTitle} News in Dominica | Dominica News`
      : "Dominica News: Latest & Breaking News in Dominica");
  const pageDesc = catMeta?.desc
    ?? (isCategory
      ? `Latest ${sectionTitle.toLowerCase()} news, updates and analysis from Dominica and the Caribbean by Dominica News.`
      : "Dominica News delivers the latest breaking news in Dominica — politics, business, sports, crime, weather and Caribbean updates from the Commonwealth of Dominica.");
  const canonical = isCategory
    ? `https://www.dominicanews.dm/category/${activeCat}`
    : "https://www.dominicanews.dm/";
  const breadcrumbLd = isCategory
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Dominica News", item: "https://www.dominicanews.dm/" },
          { "@type": "ListItem", position: 2, name: sectionTitle, item: canonical },
        ],
      }
    : null;
  const collectionLd = isCategory
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${sectionTitle} News`,
        url: canonical,
        isPartOf: { "@type": "WebSite", name: "Dominica News", url: "https://www.dominicanews.dm" },
      }
    : null;
  const heroImageForPreload = heroArticle?.image
    ? getOptimizedImageUrl(heroArticle.image, { width: 1200, format: "webp", quality: 78 })
    : "";
  const itemListLd = mappedArticles.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: isCategory ? `${sectionTitle} News` : "Latest News",
        itemListElement: mappedArticles.slice(0, 20).map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://www.dominicanews.dm/news/${a.slug}`,
          name: a.title,
        })),
      }
    : null;
  const rssHref = isCategory
    ? `https://www.dominicanews.dm/rss.xml?category=${encodeURIComponent(activeCat!)}`
    : "https://www.dominicanews.dm/rss.xml";
  const rssTitle = isCategory ? `${sectionTitle} — Dominica News RSS` : "Dominica News RSS";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle.slice(0, 60)}</title>
        <meta name="description" content={pageDesc.slice(0, 160)} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <link rel="alternate" type="application/rss+xml" title={rssTitle} href={rssHref} />
        {heroImageForPreload && (
          <link rel="preload" as="image" href={heroImageForPreload} fetchPriority="high" />
        )}
        {breadcrumbLd && (
          <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
        )}
        {collectionLd && (
          <script type="application/ld+json">{JSON.stringify(collectionLd)}</script>
        )}
        {itemListLd && (
          <script type="application/ld+json">{JSON.stringify(itemListLd)}</script>
        )}
      </Helmet>
      <SiteHeader />
      <NavBar />


      {/* Breaking Ticker */}
      {!activeCat && breakingArticles.length > 0 && (
        <BreakingTicker items={breakingArticles} />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {isCategory && (
          <nav aria-label="breadcrumb" className="-mb-4">
            <ol className="flex items-center gap-1.5 text-[13px] text-muted-foreground font-body flex-wrap">
              <li><Link to="/" className="hover:text-primary transition-colors">Dominica News</Link></li>
              <li>›</li>
              <li className="text-foreground font-medium" aria-current="page">{sectionTitle}</li>
              <li className="ml-3">
                <Link to="/" className="text-primary hover:underline text-xs">← Back to Latest News</Link>
              </li>
            </ol>
          </nav>
        )}

        {isCategory && catMeta?.intro && (
          <section className="-mt-2 sm:-mt-4 max-w-4xl">
            <p className="text-[14.5px] sm:text-[15px] md:text-base text-muted-foreground font-body leading-[1.7] sm:leading-[1.75]">
              {catMeta.intro}
            </p>
            {mappedArticles[0]?.date && (
              <p className="mt-3 inline-flex items-center gap-2 text-[11.5px] font-body text-primary bg-primary/8 border border-primary/15 rounded-full px-3 py-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                Updated {mappedArticles[0].date}
              </p>
            )}
          </section>
        )}

        {!activeCat && (
          <section className="-mt-2 sm:-mt-4" aria-label="About Dominica News">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl md:text-[34px] leading-[1.15] tracking-tight text-foreground mb-3">
              Dominica News - Latest <span className="font-body">&amp;</span> Breaking News from Dominica
            </h1>
            <p className="text-[14.5px] sm:text-[15px] md:text-base text-muted-foreground font-body leading-[1.7] sm:leading-[1.75]">
              <strong className="text-foreground font-semibold">Dominica News</strong> is the leading independent
              news online source in the Commonwealth of Dominica, publishing the latest news from Dominica and
              Dominica breaking news every day - politics, weather, business, crime, community stories and Caribbean
              updates from Roseau, Portsmouth and across the Nature Isle. Trusted by readers at home and in the
              Dominican diaspora for verified reports, official statements and in-depth features. Jump straight to{" "}
              <Link to="/category/dominica" className="text-primary hover:underline">Dominica news</Link>,{" "}
              <Link to="/category/politics" className="text-primary hover:underline">politics</Link>,{" "}
              <Link to="/category/weather" className="text-primary hover:underline">weather</Link>, or{" "}
              <Link to="/category/caribbean" className="text-primary hover:underline">Caribbean coverage</Link>.
            </p>
          </section>
        )}




        {/* Live Updates Section */}
        {!activeCat && (loadingLive ? (
          <section className="space-y-4">
            <SectionHeader title="Live Updates" variant="live" loading />
            <div className="h-24 skeleton-shimmer rounded-2xl" />
          </section>
        ) : activeLiveUpdates.length > 0 ? (
          <section className="animate-fade-in-up">
            <SectionHeader title="Live Updates" variant="live" />
            <div className="space-y-3">
              {activeLiveUpdates.map((u) => (
                <Link key={u.id} to={`/live/${u.slug}`} className="block group">
                  <div className="flex gap-5 items-start bg-card rounded-2xl p-5 border border-destructive/10 hover:border-destructive/25 hover:shadow-card-hover transition-all duration-500 card-lift">
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
                        className="w-40 h-28 object-cover rounded-xl flex-shrink-0 group-hover:opacity-90 transition-opacity shadow-sm"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center gap-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.15em]">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive-foreground" />
                          </span>
                          LIVE
                        </span>
                        {u.updated_at && (
                          <span className="text-xs text-muted-foreground font-body">
                            Updated {new Date(u.updated_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/Dominica" })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading font-bold text-lg leading-[1.3] text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 mb-2">
                        {u.title}
                      </h3>
                      {u.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 font-body leading-relaxed">{u.excerpt}</p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary flex-shrink-0 mt-2 transition-colors" />
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
                <div key={i} className="rounded-2xl skeleton-shimmer h-80" />
              ))}
            </div>
          ) : mappedArticles.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground font-body">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl">📰</span>
              </div>
              <p className="text-lg mb-3 font-heading">No articles in this category yet.</p>
              <Link to="/admin/articles/create" className="text-primary hover:underline text-sm font-body inline-flex items-center gap-1">
                Publish the first article <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Hero card */}
              {heroArticle && (
                <Link to={`/news/${heroArticle.slug}`} className="block animate-fade-in-up">
                  <NewsCard article={heroArticle} isBreaking={heroArticle.is_breaking} variant="hero" priority />
                </Link>
              )}

              {/* Main grid + Trending sidebar */}
              <div className={`grid grid-cols-1 gap-12 ${!activeCat && trendingArticles.length > 0 ? "lg:grid-cols-[1fr_300px]" : ""}`}>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-7 stagger-children ${activeCat ? "lg:grid-cols-3" : ""}`}>
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

                {/* Trending sidebar - only on home */}
                {!activeCat && trendingArticles.length > 0 && (
                  <div className="hidden lg:block animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                    <div className="sticky top-20">
                      <TrendingSidebar articles={trendingArticles} />
                    </div>
                  </div>
                )}
              </div>

              {/* Load More */}
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="px-8 py-3 rounded-xl border border-border bg-card text-foreground font-heading font-bold text-sm hover:bg-accent hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More Articles"
                    )}
                  </button>
                </div>
              )}
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
      <div className="flex items-center gap-2 mb-5">
        <span className="inline-block w-2.5 h-2.5 rounded-full skeleton-shimmer" />
        <div className="h-5 w-36 skeleton-shimmer rounded" />
      </div>
    );
  }

  if (isAlert) {
    return (
      <div className="mb-5">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
          </span>
          <h2 className="text-xs font-heading font-bold text-destructive uppercase tracking-[0.2em]">
            {title}
          </h2>
        </div>
        <div className="h-px bg-gradient-to-r from-destructive/30 to-transparent" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="w-1 h-7 bg-primary rounded-full" />
      <h2 className="text-2xl font-heading font-bold text-foreground tracking-tight">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
    </div>
  );
};

export default Index;
