import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Tag as TagIcon } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import NewsCard from "@/components/NewsCard";
import { mongoApi, MongoArticle } from "@/lib/mongoApi";
import { getProxiedAssetUrl } from "@/lib/networkProxy";
import type { NewsArticle } from "@/data/newsData";

const SITE = "https://www.dominicanews.dm";

const toNewsArticle = (a: MongoArticle): NewsArticle & { slug: string } => ({
  id: 0,
  title: a.title,
  excerpt: a.excerpt,
  category: a.categories?.name || "News",
  source: a.authors?.full_name || "Dominica News",
  date: a.published_at
    ? new Date(a.published_at).toLocaleString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
        timeZone: "America/Dominica",
      }) + " AST"
    : "",
  image: getProxiedAssetUrl(a.cover_image_url || ""),
  slug: a.slug,
});

const TagPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: tags, isLoading: loadingTags } = useQuery({
    queryKey: ["tags-list"],
    queryFn: () => mongoApi.getTags(),
    staleTime: 10 * 60 * 1000,
  });

  const tag = useMemo(
    () => tags?.find((t: any) => (t.slug || "").toLowerCase() === (slug || "").toLowerCase()) || null,
    [tags, slug]
  );

  const tagName = tag?.name || slug || "";

  const { data: articles, isLoading: loadingArticles } = useQuery({
    queryKey: ["tag-articles", tagName],
    queryFn: () => mongoApi.getArticles({ status: "published", tag: tagName, limit: 60 }),
    enabled: !!tagName,
    staleTime: 5 * 60 * 1000,
  });

  const canonical = `${SITE}/tag/${slug}`;
  const title = `${tagName} — News & Coverage | Dominica News`;
  const description = `Latest Dominica News articles tagged “${tagName}”. Follow ongoing coverage, breaking updates and analysis from Dominica News.`.slice(0, 160);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Articles tagged ${tagName}`,
    description,
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "Dominica News", url: SITE },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Dominica News", item: SITE },
      { "@type": "ListItem", position: 2, name: "Tags", item: `${SITE}/tags` },
      { "@type": "ListItem", position: 3, name: tagName, item: canonical },
    ],
  };

  if (loadingTags) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader /><NavBar />
        <div className="max-w-4xl mx-auto p-16 flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading tag…
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(collectionLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <SiteHeader /><NavBar />

      <main className="max-w-6xl mx-auto px-6 py-10 font-body">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-primary underline-offset-4 hover:underline">Dominica News</Link></li>
            <li aria-hidden="true">›</li>
            <li className="text-foreground font-medium">#{tagName}</li>
          </ol>
        </nav>

        <header className="mb-10 pb-8 border-b border-border">
          <p className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-primary font-semibold mb-2">
            <TagIcon className="w-3.5 h-3.5" /> Topic
          </p>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
            #{tagName}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Every Dominica News article tagged <strong>{tagName}</strong>. Follow the full story from breaking updates to in-depth reporting.
          </p>
        </header>

        <section>
          {loadingArticles && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading articles…
            </div>
          )}
          {!loadingArticles && (articles?.length ?? 0) === 0 && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              No articles tagged “{tagName}” yet. Browse the{" "}
              <Link to="/" className="text-primary hover:underline">latest Dominica news</Link>.
            </div>
          )}
          {!loadingArticles && articles && articles.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <Link key={a.slug} to={`/news/${a.slug}`} className="block">
                  <NewsCard article={toNewsArticle(a)} />
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

export default TagPage;
