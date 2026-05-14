import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { mongoApi } from "@/lib/mongoApi";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import PageLoader from "@/components/PageLoader";

const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["page", slug],
    queryFn: () => mongoApi.getPageBySlug(slug!),
    enabled: !!slug,
  });

  const canonical = `https://www.dominicanews.dm/page/${slug}`;
  const pageTitle = page ? `${page.title} | Dominica News` : "Dominica News";
  const rawDesc = page?.subtitle || (page?.body ? page.body.replace(/<[^>]+>/g, " ").trim() : "");
  const pageDesc = (rawDesc || "Dominica News information page.").slice(0, 160);
  const webPageLd = page
    ? {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.title,
        description: pageDesc,
        url: canonical,
        isPartOf: { "@type": "WebSite", name: "Dominica News", url: "https://www.dominicanews.dm" },
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        {webPageLd && (
          <script type="application/ld+json">{JSON.stringify(webPageLd)}</script>
        )}
      </Helmet>
      {isLoading && <PageLoader />}
      <SiteHeader />
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-12 font-body animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="space-y-2 mt-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-destructive">Page not found.</p>}
        {page && (
          <>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">{page.title}</h1>
            {page.subtitle && (
              <p className="text-lg text-muted-foreground mb-6">{page.subtitle}</p>
            )}
            <div
              className="prose prose-lg text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default DynamicPage;
