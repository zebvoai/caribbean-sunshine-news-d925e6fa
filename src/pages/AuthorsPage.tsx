import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Newspaper } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import { mongoApi } from "@/lib/mongoApi";

const SITE = "https://www.dominicanews.dm";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");

const AuthorsPage = () => {
  const { data: authors, isLoading } = useQuery({
    queryKey: ["authors-list"],
    queryFn: () => mongoApi.getAuthors(),
    staleTime: 10 * 60 * 1000,
  });

  const active = (authors || []).filter((a) => a.is_active !== false);
  const canonical = `${SITE}/authors`;
  const title = "Our Reporters & Editors | Dominica News";
  const description =
    "Meet the reporters, editors and contributors behind Dominica News — the journalists covering politics, weather, business and community stories across the Commonwealth of Dominica.";

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Dominica News reporters and editors",
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "Dominica News", url: SITE },
    about: active.map((a) => ({
      "@type": "Person",
      name: a.full_name,
      jobTitle: a.role || "Reporter",
      url: `${SITE}/author/${a.slug || slugify(a.full_name)}`,
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Dominica News", item: SITE },
      { "@type": "ListItem", position: 2, name: "Authors", item: canonical },
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
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(collectionLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <SiteHeader />
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 font-body">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-primary underline-offset-4 hover:underline">Dominica News</Link></li>
            <li aria-hidden="true">›</li>
            <li className="text-foreground font-medium">Authors</li>
          </ol>
        </nav>

        <header className="mb-10 pb-8 border-b border-border">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">Newsroom</p>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            Our Reporters <span className="font-body">&</span> Editors
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Dominica News is produced by local journalists reporting from Roseau, Portsmouth and
            across the Nature Isle. Every story is written, edited and verified by the newsroom
            team below — browse a profile to read all of that contributor's latest news from Dominica.
          </p>
        </header>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading newsroom…
          </div>
        )}

        {!isLoading && active.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Contributor profiles are being updated. Please check back soon.
          </div>
        )}

        {!isLoading && active.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((a) => {
              const slug = a.slug || slugify(a.full_name);
              return (
                <Link
                  key={a.id}
                  to={`/author/${slug}`}
                  className="group rounded-3xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {a.avatar_url ? (
                      <img
                        src={a.avatar_url}
                        alt={`${a.full_name} — ${a.role || "reporter"} at Dominica News`}
                        loading="lazy"
                        className="w-16 h-16 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-heading font-bold text-xl flex items-center justify-center">
                        {a.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="font-heading font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                        {a.full_name}
                      </h2>
                      <p className="text-xs uppercase tracking-wider text-primary font-semibold">
                        {a.role || "Reporter"}
                      </p>
                    </div>
                  </div>

                  {a.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{a.bio}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {a.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {a.location}
                      </span>
                    )}
                    {typeof a.articles_count === "number" && a.articles_count > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Newspaper className="w-3.5 h-3.5" /> {a.articles_count} article
                        {a.articles_count === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="font-heading font-bold text-xl text-foreground mb-3">More from Dominica News</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link to="/" className="text-primary hover:underline">Latest news from Dominica</Link>
            <Link to="/category/politics" className="text-primary hover:underline">Dominica politics</Link>
            <Link to="/category/weather" className="text-primary hover:underline">Dominica weather</Link>
            <Link to="/category/caribbean" className="text-primary hover:underline">Caribbean news</Link>
            <Link to="/obituaries" className="text-primary hover:underline">Obituaries</Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default AuthorsPage;
