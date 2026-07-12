import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, MapPin } from "lucide-react";
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

const AuthorPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: authors, isLoading: loadingAuthors } = useQuery({
    queryKey: ["authors-list"],
    queryFn: () => mongoApi.getAuthors(),
    staleTime: 10 * 60 * 1000,
  });

  const author = useMemo(
    () => authors?.find((a) => (a.slug || "").toLowerCase() === (slug || "").toLowerCase()) || null,
    [authors, slug]
  );

  const { data: articles, isLoading: loadingArticles } = useQuery({
    queryKey: ["author-articles", author?.id],
    queryFn: () => mongoApi.getArticles({ status: "published", author_id: author!.id, limit: 60 }),
    enabled: !!author?.id,
    staleTime: 5 * 60 * 1000,
  });

  const canonical = `${SITE}/author/${slug}`;

  if (loadingAuthors) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader /><NavBar />
        <div className="max-w-4xl mx-auto p-16 flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading author…
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Author not found | Dominica News</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <SiteHeader /><NavBar />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-heading font-bold mb-4">Author not found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find this contributor profile.</p>
          <Link to="/" className="text-primary hover:underline">← Back to Dominica News</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const title = `${author.full_name} — Reporter at Dominica News`;
  const description = author.bio
    ? author.bio.slice(0, 160)
    : `Read the latest news articles by ${author.full_name}, contributor at Dominica News covering Dominica and Caribbean affairs.`;

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.full_name,
    jobTitle: author.role || "Reporter",
    description: author.bio || undefined,
    image: author.avatar_url || undefined,
    url: canonical,
    worksFor: { "@type": "NewsMediaOrganization", name: "Dominica News", url: SITE },
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Articles by ${author.full_name}`,
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "Dominica News", url: SITE },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Dominica News", item: SITE },
      { "@type": "ListItem", position: 2, name: "Authors", item: `${SITE}/authors` },
      { "@type": "ListItem", position: 3, name: author.full_name, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="profile" />
        {author.avatar_url && <meta property="og:image" content={author.avatar_url} />}
        <script type="application/ld+json">{JSON.stringify(personLd)}</script>
        <script type="application/ld+json">{JSON.stringify(collectionLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <SiteHeader /><NavBar />

      <main className="max-w-6xl mx-auto px-6 py-10 font-body">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-primary underline-offset-4 hover:underline">Dominica News</Link></li>
            <li aria-hidden="true">›</li>
            <li className="text-foreground font-medium">{author.full_name}</li>
          </ol>
        </nav>

        <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-border">
          {author.avatar_url ? (
            <img src={author.avatar_url} alt={author.full_name} className="w-28 h-28 rounded-full object-cover border border-border" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-primary/10 text-primary font-heading font-bold text-3xl flex items-center justify-center">
              {author.full_name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">{author.role || "Reporter"}</p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">{author.full_name}</h1>
            {author.bio && <p className="text-muted-foreground max-w-2xl">{author.bio}</p>}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              {author.location && <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {author.location}</span>}
              {author.email && <a href={`mailto:${author.email}`} className="inline-flex items-center gap-1 hover:text-primary"><Mail className="w-4 h-4" /> {author.email}</a>}
            </div>
          </div>
        </header>

        <section>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-6">
            Articles by {author.full_name}
          </h2>
          {loadingArticles && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading articles…
            </div>
          )}
          {!loadingArticles && (articles?.length ?? 0) === 0 && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              No published articles yet from this contributor.
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

export default AuthorPage;
