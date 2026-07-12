import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Loader2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import NewsCard from "@/components/NewsCard";
import SiteFooter from "@/components/SiteFooter";
import { mongoApi, MongoArticle } from "@/lib/mongoApi";
import { getProxiedAssetUrl } from "@/lib/networkProxy";
import type { NewsArticle } from "@/data/newsData";

export interface TopicLandingPageProps {
  /** Route-scoped canonical path, e.g. `/dominica-carnival-2026`. Leading slash required. */
  canonicalPath: string;
  /** SEO title (no site suffix — appended automatically). */
  seoTitle: string;
  /** Meta description (<=160 chars). */
  seoDescription: string;
  /** Visible page H1. */
  heading: string;
  /** One-line kicker below the heading. */
  kicker?: string;
  /** Rich intro paragraphs (HTML allowed). */
  introHtml: string;
  /** Optional slug of a Pages CMS entry whose body overrides `introHtml` when it exists. */
  editableSlug?: string;
  /** Search queries executed in parallel then merged (deduped by slug). */
  queries: string[];
  /** Breadcrumb label for the current page (defaults to heading). */
  breadcrumbLabel?: string;
  /** Optional extra JSON-LD blocks (Event, Person, etc). */
  extraJsonLd?: Record<string, unknown>[];
  /** Optional FAQ entries — rendered as a visible section and emitted as FAQPage JSON-LD. */
  faqs?: { question: string; answer: string }[];
  /** Max articles to show. Default 24. */
  limit?: number;
}

const SITE = "https://www.dominicanews.dm";

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

const TopicLandingPage = ({
  canonicalPath,
  seoTitle,
  seoDescription,
  heading,
  kicker,
  introHtml,
  editableSlug,
  queries,
  breadcrumbLabel,
  extraJsonLd,
  faqs,
  limit = 24,
}: TopicLandingPageProps) => {
  const canonical = `${SITE}${canonicalPath}`;
  const fullTitle = seoTitle.includes("Dominica News") ? seoTitle : `${seoTitle} | Dominica News`;

  // Editable intro override from Pages CMS (optional)
  const { data: cmsPage } = useQuery({
    queryKey: ["topic-cms", editableSlug],
    queryFn: async () => {
      try {
        return await mongoApi.getPageBySlug(editableSlug!);
      } catch {
        return null;
      }
    },
    enabled: !!editableSlug,
    retry: false,
  });


  const results = useQueries({
    queries: queries.map((q) => ({
      queryKey: ["topic-articles", q],
      queryFn: () => mongoApi.getArticles({ status: "published", q, limit: 40 }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const merged: MongoArticle[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    for (const a of r.data || []) {
      if (!seen.has(a.slug)) {
        seen.add(a.slug);
        merged.push(a);
      }
    }
  }
  merged.sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""));
  const articles = merged.slice(0, limit);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Dominica News", item: SITE },
      { "@type": "ListItem", position: 2, name: breadcrumbLabel || heading, item: canonical },
    ],
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: heading,
    description: seoDescription,
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "Dominica News", url: SITE },
  };

  const faqLd = faqs && faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  const jsonLdBlocks = [breadcrumbLd, collectionLd, ...(extraJsonLd || []), ...(faqLd ? [faqLd] : [])];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{fullTitle}</title>
        <meta name="description" content={seoDescription.slice(0, 160)} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={seoDescription.slice(0, 160)} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={seoDescription.slice(0, 160)} />
        {jsonLdBlocks.map((block, i) => (
          <script key={i} type="application/ld+json">{JSON.stringify(block)}</script>
        ))}
      </Helmet>

      <SiteHeader />
      <NavBar />

      <main className="max-w-6xl mx-auto px-6 py-10 font-body">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-primary underline-offset-4 hover:underline">Dominica News</Link></li>
            <li aria-hidden="true">›</li>
            <li className="text-foreground font-medium">{breadcrumbLabel || heading}</li>
          </ol>
        </nav>

        <header className="mb-10 animate-fade-in-up">
          {kicker && (
            <p className="text-sm uppercase tracking-widest text-primary font-semibold mb-3">{kicker}</p>
          )}
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">{heading}</h1>
          <div
            className="prose prose-lg max-w-3xl text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: cmsPage?.body || introHtml }}
          />
        </header>

        <section aria-labelledby="topic-coverage-heading" className="mt-12">
          <h2 id="topic-coverage-heading" className="text-2xl font-heading font-bold text-foreground mb-6">
            Latest coverage
          </h2>

          {isLoading && (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading stories…
            </div>
          )}

          {!isLoading && articles.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              <p className="mb-4">No stories published yet for this topic.</p>
              <Link to="/" className="inline-flex items-center text-primary hover:underline">
                Browse the latest Dominica news <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          )}

          {!isLoading && articles.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <Link key={a.slug} to={`/news/${a.slug}`} className="block">
                  <NewsCard article={toNewsArticle(a)} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {faqs && faqs.length > 0 && (
          <section aria-labelledby="topic-faq-heading" className="mt-16">
            <h2 id="topic-faq-heading" className="text-2xl font-heading font-bold text-foreground mb-6">
              Frequently asked questions
            </h2>
            <dl className="space-y-5">
              {faqs.map((f, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-6">
                  <dt className="font-heading font-semibold text-foreground mb-2">{f.question}</dt>
                  <dd className="text-muted-foreground leading-relaxed">{f.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="mt-16 rounded-3xl bg-muted/40 p-8">
          <h2 className="text-xl font-heading font-bold text-foreground mb-3">More from Dominica News</h2>
          <p className="text-muted-foreground mb-4">
            Follow our full coverage of{" "}
            <Link to="/" className="text-primary hover:underline">breaking news in Dominica</Link>, or explore{" "}
            <Link to="/category/politics" className="text-primary hover:underline">Politics</Link>,{" "}
            <Link to="/category/caribbean" className="text-primary hover:underline">Caribbean</Link>,{" "}
            <Link to="/category/dominica" className="text-primary hover:underline">Dominica</Link> and{" "}
            <Link to="/category/weather" className="text-primary hover:underline">Weather</Link>.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default TopicLandingPage;
