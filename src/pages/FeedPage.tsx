import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Rss } from "lucide-react";
import { Helmet } from "react-helmet-async";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import { mongoApi, MongoArticle } from "@/lib/mongoApi";
import { getProxiedAssetUrl, retryImageFallback } from "@/lib/networkProxy";

const ARTICLES_PER_PAGE = 20;

const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Dominica",
      }) + " AST"
    : "";

const FeedPage = () => {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["articles-feed"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      mongoApi.getArticles({
        status: "published",
        limit: ARTICLES_PER_PAGE,
        skip: pageParam as number,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < ARTICLES_PER_PAGE) return undefined;
      return allPages.reduce((acc, p) => acc + p.length, 0);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const articles: MongoArticle[] = data?.pages.flat() ?? [];

  const itemListLd = articles.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Dominica News Feed",
        itemListElement: articles.slice(0, 30).map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://www.dominicanews.dm/news/${a.slug}`,
          name: a.title,
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>News Feed: Every Story in Order | Dominica News</title>
        <meta
          name="description"
          content="Browse every Dominica News story in reverse chronological order - the latest articles from all categories in one simple feed, updated throughout the day."
        />
        <link rel="canonical" href="https://www.dominicanews.dm/feed" />
        <meta property="og:title" content="News Feed | Dominica News" />
        <meta
          property="og:description"
          content="Every Dominica News story in reverse chronological order - browse the latest articles from all categories in one feed."
        />
        <meta property="og:url" content="https://www.dominicanews.dm/feed" />
        <meta property="og:type" content="website" />
        <link rel="alternate" type="application/rss+xml" title="Dominica News RSS" href="https://www.dominicanews.dm/rss.xml" />
        {itemListLd && (
          <script type="application/ld+json">{JSON.stringify(itemListLd)}</script>
        )}
      </Helmet>
      <SiteHeader />
      <NavBar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <nav aria-label="breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-[13px] text-muted-foreground font-body flex-wrap">
            <li><Link to="/" className="hover:text-primary transition-colors">Dominica News</Link></li>
            <li>›</li>
            <li className="text-foreground font-medium" aria-current="page">Feed</li>
          </ol>
        </nav>

        <header className="mb-8">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl leading-[1.15] tracking-tight text-foreground mb-3">
            News Feed
          </h1>
          <p className="text-[14.5px] sm:text-[15px] text-muted-foreground font-body leading-[1.7]">
            Every story from Dominica News in reverse chronological order - the newest articles first,
            across all categories. Prefer a machine-readable version? Subscribe to our{" "}
            <a href="/rss.xml" className="text-primary hover:underline inline-flex items-center gap-1">
              RSS feed <Rss className="h-3.5 w-3.5" />
            </a>.
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl skeleton-shimmer h-28" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground font-body">
            <p className="text-lg font-heading">No articles published yet.</p>
          </div>
        ) : (
          <>
            <ol className="space-y-4 stagger-children">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/news/${a.slug}`}
                    className="flex gap-4 sm:gap-5 items-start bg-card rounded-2xl p-4 sm:p-5 border border-border hover:border-primary/25 hover:shadow-card-hover transition-all duration-300 card-lift group"
                  >
                    {a.cover_image_url && (
                      <img
                        src={getProxiedAssetUrl(a.cover_image_url)}
                        alt={a.cover_image_alt || a.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (retryImageFallback(img)) return;
                          if (img.dataset.fallbackApplied === "true") { img.style.display = "none"; return; }
                          img.dataset.fallbackApplied = "true";
                          img.src = "/placeholder.svg";
                        }}
                        className="w-24 h-20 sm:w-36 sm:h-24 object-cover rounded-xl flex-shrink-0 shadow-sm"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-heading font-bold text-primary uppercase tracking-[0.15em]">
                          {a.categories?.name || "News"}
                        </span>
                        {a.is_breaking && (
                          <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.12em]">
                            Breaking
                          </span>
                        )}
                      </div>
                      <h2 className="font-heading font-bold text-base sm:text-lg leading-[1.3] text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 mb-1.5">
                        {a.title}
                      </h2>
                      <p className="text-xs text-muted-foreground font-body">
                        {a.authors?.full_name && <span>{a.authors.full_name} · </span>}
                        {formatDate(a.published_at)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>

            {hasNextPage && (
              <div className="flex justify-center pt-8">
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
                    "Load Older Articles"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default FeedPage;
