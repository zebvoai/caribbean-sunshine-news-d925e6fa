import { useEffect, useState, useRef, useCallback } from "react";

import { useParams, Link, useNavigate } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import { mongoApi } from "@/lib/mongoApi";
import { getProxiedAssetUrl } from "@/lib/networkProxy";
import PageLoader from "@/components/PageLoader";
import SocialEmbedRenderer from "@/components/SocialEmbedRenderer";
import InlineArticleBody from "@/components/InlineArticleBody";
import ArticleFAQ from "@/components/ArticleFAQ";
import {
  Calendar,
  User,
  Clock,
  Eye,
  Zap,
  Star,
  Facebook,
  Twitter,
  Link2,
  ChevronRight,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Author {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
}

interface Category {
  name: string;
  slug: string;
}

interface SocialEmbed {
  platform: string;
  embed_url: string | null;
  embed_code: string | null;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  is_breaking: boolean;
  is_featured: boolean;
  is_pinned: boolean;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  updated_at: string | null;
  view_count: number;
  primary_category_id: string | null;
  authors: Author | null;
  categories: Category | null;
  social_embeds: SocialEmbed[];
}

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  published_at: string | null;
  categories: { name: string } | null;
  authors: { full_name: string } | null;
}

const calcReadTime = (body: string): number => {
  const text = body.replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 225));
};

const DOMINICA_TZ = "America/Dominica";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: DOMINICA_TZ,
  }) +
  " | " +
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: DOMINICA_TZ,
    timeZoneName: "short",
  });

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max) + "…" : str;

// ─── Related Article Card ────────────────────────────────────────────────────
const RelatedCard = ({ article }: { article: RelatedArticle }) => (
  <Link
    to={`/news/${article.slug}`}
    className="group flex flex-col bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-card-hover transition-all duration-300 card-lift"
  >
    <div className="aspect-[16/9] overflow-hidden bg-muted">
      {article.cover_image_url ? (
        <img
          src={getProxiedAssetUrl(article.cover_image_url)}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.dataset.fallbackApplied === "true") { img.style.display = "none"; return; }
            img.dataset.fallbackApplied = "true";
            img.src = "/placeholder.svg";
          }}
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-xs">No image</span>
        </div>
      )}
    </div>
    <div className="p-4 flex flex-col gap-2 flex-1">
      {article.categories && (
        <span className="text-[10px] font-semibold font-body uppercase tracking-wider text-primary">
          {article.categories.name}
        </span>
      )}
      <h3 className="text-sm font-heading font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
        {article.title}
      </h3>
      <p className="text-xs text-muted-foreground font-body line-clamp-2 flex-1">
        {article.excerpt}
      </p>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-body mt-auto pt-2 border-t border-border/50">
        {article.authors && <span>{article.authors.full_name}</span>}
        {article.published_at && (
          <>
            {article.authors && <span className="w-1 h-1 rounded-full bg-border" />}
            <span>
              {new Date(article.published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: DOMINICA_TZ,
              })}
            </span>
          </>
        )}
      </div>
    </div>
  </Link>
);

// ─── Main ArticlePage ────────────────────────────────────────────────────────
const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [moreFromAuthor, setMoreFromAuthor] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const viewCounted = useRef(false);
  const articleRef = useRef<HTMLElement>(null);

  // ── Reading progress ────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    if (!articleRef.current) return;
    const el = articleRef.current;
    const rect = el.getBoundingClientRect();
    const total = el.scrollHeight - window.innerHeight;
    const scrolled = -rect.top;
    const pct = Math.min(100, Math.max(0, (scrolled / total) * 100));
    setProgress(pct);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // ── Fetch article ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    viewCounted.current = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await mongoApi.getArticleBySlug(slug);
        setArticle(data as unknown as Article);
      } catch {
        navigate("/404", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, navigate]);

  // ── Increment view count ───────────
  useEffect(() => {
    if (!article || viewCounted.current) return;
    const timer = setTimeout(() => {
      if (viewCounted.current) return;
      viewCounted.current = true;
      mongoApi.incrementView((article as any).slug).catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [article]);

  // ── Fetch related articles ─────────────────────────────────────────────────
  useEffect(() => {
    if (!article) return;
    const fetchRelated = async () => {
      let results: RelatedArticle[] = [];

      if ((article as any).primary_category_id) {
        const data = await mongoApi.getArticles({
          status: "published",
          category_id: (article as any).primary_category_id,
          exclude_id: (article as any).id,
          limit: 6,
        }).catch(() => []);
        results = data as unknown as RelatedArticle[];
      }

      if (results.length < 6) {
        const existingIds = [(article as any).id, ...results.map((r) => r.id)];
        const fallback = await mongoApi.getArticles({ status: "published", limit: 20 }).catch(() => []);
        const filtered = (fallback as unknown as RelatedArticle[]).filter(
          (a) => !existingIds.includes(a.id)
        );
        results = [...results, ...filtered.slice(0, 6 - results.length)];
      }

      setRelated(results.slice(0, 6));
    };
    fetchRelated();
  }, [article]);

  // ── Fetch more from same author ────────────────────────────────────────────
  useEffect(() => {
    if (!article) return;
    const authorId = (article as any).authors?.id || (article as any).author_id;
    if (!authorId) return;
    mongoApi
      .getArticles({
        status: "published",
        author_id: authorId,
        exclude_id: (article as any).id,
        limit: 3,
      })
      .then((data) => setMoreFromAuthor(data as unknown as RelatedArticle[]))
      .catch(() => setMoreFromAuthor([]));
  }, [article]);


  // ── SEO meta tags ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!article) return;
    const title = article.meta_title || article.title;
    const description = article.meta_description || article.excerpt;
    const url = window.location.href;
    const image = article.cover_image_url || "";

    document.title = title + " | Dominica News";

    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", url, "property");
    setMeta("og:type", "article", "property");
    setMeta("og:image", image, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", image);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link") as HTMLLinkElement;
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    const wordCount = article.body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      headline: title,
      description: description,
      image: image
        ? [image]
        : ["https://www.dominicanews.dm/favicon.svg"],
      datePublished: article.published_at,
      dateModified: article.updated_at || article.published_at,
      wordCount,
      articleSection: article.categories?.name || "News",
      author: article.authors
        ? { "@type": "Person", name: article.authors.full_name, jobTitle: article.authors.role }
        : { "@type": "Organization", name: "Dominica News" },
      publisher: {
        "@type": "NewsMediaOrganization",
        name: "Dominica News",
        url: "https://www.dominicanews.dm",
        logo: {
          "@type": "ImageObject",
          url: "https://www.dominicanews.dm/favicon.svg",
          width: 180,
          height: 180,
        },
      },
      url,
      isAccessibleForFree: true,
      inLanguage: "en",
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "[data-speakable='excerpt']", ".news-prose p"],
      },
    };
    if (article.is_breaking) {
      schema.genre = "Breaking News";
    }
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Dominica News", item: "https://www.dominicanews.dm/" },
        {
          "@type": "ListItem",
          position: 2,
          name: article.categories?.name || "News",
          item: `https://www.dominicanews.dm/category/${article.categories?.slug || "news"}`,
        },
        { "@type": "ListItem", position: 3, name: article.title, item: url },
      ],
    };
    let ld = document.querySelector('script[type="application/ld+json"]');
    if (!ld) {
      ld = document.createElement("script");
      ld.setAttribute("type", "application/ld+json");
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(schema);
    let bcLd = document.querySelector('script[type="application/ld+json"][data-bc="1"]');
    if (!bcLd) {
      bcLd = document.createElement("script");
      bcLd.setAttribute("type", "application/ld+json");
      bcLd.setAttribute("data-bc", "1");
      document.head.appendChild(bcLd);
    }
    bcLd.textContent = JSON.stringify(breadcrumbSchema);

    return () => {
      document.title = "Dominica News";
    };
  }, [article]);

  // ── Share handlers ─────────────────────────────────────────────────────────
  const articlePath = slug ? `/news/${slug}` : "";
  const shareUrl = `https://www.dominicanews.dm${articlePath}`;

  const shareFacebook = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");

  const shareTwitter = () =>
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article?.title || "")}`,
      "_blank"
    );

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: article?.title || "", url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied!", description: shareUrl });
      } catch {
        toast({ title: "Copy failed", description: "Please copy the URL manually.", variant: "destructive" });
      }
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageLoader />
        <SiteHeader />
        <NavBar />
        <div className="max-w-4xl mx-auto px-6 py-16 space-y-6 animate-pulse">
          <div className="h-4 bg-muted rounded w-48" />
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-72 bg-muted rounded-2xl" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`h-4 bg-muted rounded ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article) return null;

  const readTime = calcReadTime(article.body);
  const pubDate = article.published_at ? formatDate(article.published_at) : "";
  const showUpdated =
    !!article.updated_at &&
    !!article.published_at &&
    Math.abs(new Date(article.updated_at).getTime() - new Date(article.published_at).getTime()) >
      1000 * 60 * 60 * 24;
  const updatedDate = showUpdated && article.updated_at ? formatDate(article.updated_at) : "";
  const categorySlug = article.categories?.slug || "news";
  const categoryName = article.categories?.name || "News";
  const authorRole =
    article.authors?.role === "admin"
      ? "Administrator"
      : article.authors?.role === "editor"
      ? "Editor"
      : "Reporter";

  return (
    <div className="min-h-screen bg-background">
      {/* Reading progress bar */}
      <div className="reading-progress" style={{ "--progress": `${progress}%` } as React.CSSProperties} />

      <SiteHeader />
      <NavBar />

      <main ref={articleRef} className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <nav aria-label="breadcrumb" className="mb-8 animate-fade-in-up">
          <ol className="flex items-center gap-1.5 text-[13px] text-muted-foreground font-body flex-wrap">
            <li>
              <Link to="/" className="hover:text-primary transition-colors">Dominica News</Link>
            </li>
            <li><ChevronRight className="h-3.5 w-3.5" /></li>
            <li>
              <Link to={`/category/${categorySlug}`} className="hover:text-primary transition-colors">{categoryName}</Link>
            </li>
            <li><ChevronRight className="h-3.5 w-3.5" /></li>
            <li className="text-foreground font-medium max-w-xs truncate" aria-current="page">
              {truncate(article.title, 50)}
            </li>
          </ol>
        </nav>

        {/* ── Badges ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          {article.is_breaking && (
            <span className="inline-flex items-center gap-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-[0.15em]">
              <Zap className="h-3 w-3" />
              Breaking News
            </span>
          )}
          {article.is_featured && (
            <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-[9px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-[0.15em]">
              <Star className="h-3 w-3" />
              Featured
            </span>
          )}
          {article.categories && (
            <Link
              to={`/category/${categorySlug}`}
              className="inline-block bg-primary/8 text-primary text-[9px] font-semibold px-3.5 py-1.5 rounded-full hover:bg-primary/15 transition-colors uppercase tracking-[0.15em] border border-primary/15"
            >
              {categoryName}
            </Link>
          )}
        </div>

        {/* ── Title ───────────────────────────────────────────────────────── */}
        <h1
          className="text-[1.85rem] md:text-[3rem] font-heading font-extrabold text-foreground leading-[1.08] mb-6 animate-fade-in-up tracking-tight"
          style={{ animationDelay: "0.1s" }}
        >
          {(article as any).seo_h1?.trim() || article.title}
        </h1>

        {/* ── Excerpt ─────────────────────────────────────────────────────── */}
        <p
          data-speakable="excerpt"
          className="text-base md:text-lg text-muted-foreground font-serif italic mb-8 leading-[1.7] border-l-4 border-primary/25 pl-6 animate-fade-in-up"
          style={{ animationDelay: "0.15s" }}
        >
          {article.excerpt}
        </p>

        {/* ── Meta Row ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground font-body mb-10 pb-7 border-b border-border/60 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <span className="font-semibold text-foreground">Dominica News</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          {pubDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Published {pubDate}
            </span>
          )}
          {showUpdated && (
            <>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1 text-primary font-medium">
                <Calendar className="h-3.5 w-3.5" />
                Updated {updatedDate}
              </span>
            </>
          )}
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {readTime} min read
          </span>
          {article.authors && (
            <>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {article.authors.full_name}
              </span>
            </>
          )}
        </div>

        {/* ── Cover Image ─────────────────────────────────────────────────── */}
        {article.cover_image_url && (
          <figure className="mb-12 -mx-4 md:mx-0 md:rounded-2xl overflow-hidden shadow-card-hover animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
            <img
              src={getProxiedAssetUrl(article.cover_image_url)}
              alt={article.cover_image_alt || article.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget;
                if (retryImageFallback(img)) return;
                if (img.dataset.fallbackApplied === "true") { img.style.display = "none"; return; }
                img.dataset.fallbackApplied = "true";
                img.src = "/placeholder.svg";
              }}
              className="w-full max-h-[560px] object-cover"
            />
            {article.cover_image_alt && (
              <figcaption className="text-[11px] text-muted-foreground text-center py-3 px-4 bg-muted/20 font-body italic">
                {article.cover_image_alt}
              </figcaption>
            )}
          </figure>
        )}

        {/* ── Share Bar ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-12 py-5 border-y border-border/40 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <span className="text-[10px] font-bold font-body text-muted-foreground mr-1 uppercase tracking-[0.15em] flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </span>
          <button
            onClick={shareFacebook}
            aria-label="Share on Facebook"
            className="flex items-center gap-1.5 text-[11px] font-body font-semibold px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground hover:opacity-90 hover:shadow-md transition-all duration-300"
          >
            <Facebook className="h-3.5 w-3.5" />
            Facebook
          </button>
          <button
            onClick={shareTwitter}
            aria-label="Share on Twitter"
            className="flex items-center gap-1.5 text-[11px] font-body font-semibold px-4 py-2.5 rounded-xl bg-foreground/85 text-background hover:opacity-90 hover:shadow-md transition-all duration-300"
          >
            <Twitter className="h-3.5 w-3.5" />
            Twitter
          </button>
          <button
            onClick={handleShare}
            aria-label="Share"
            className="flex items-center gap-1.5 text-[11px] font-body font-semibold px-4 py-2.5 rounded-xl border border-border/60 text-foreground hover:bg-muted/60 hover:shadow-sm transition-all duration-300"
          >
            <Link2 className="h-3.5 w-3.5" />
            Copy Link
          </button>
        </div>

        {/* ── Article Body (with inline embeds, entity links, TOC) ────── */}
        <InlineArticleBody
          html={article.body}
          className="news-prose text-justify max-w-none"
          style={{ animationDelay: "0.35s" }}
          imageAltFallback={`${article.title} — ${categoryName} news from Dominica News`}
        />

        {/* ── In-body category hub link (SEO: descriptive anchor to category) ── */}
        <aside className="my-10 rounded-2xl border-l-4 border-primary/40 bg-muted/30 p-5 not-prose">
          <p className="text-[13.5px] text-foreground/85 font-body leading-relaxed">
            <strong className="text-foreground">More {categoryName} news:</strong>{" "}
            Follow our full coverage of{" "}
            <Link to={`/category/${categorySlug}`} className="text-primary font-semibold hover:underline">
              Dominica {categoryName.toLowerCase()} news
            </Link>
            {" "}or read the{" "}
            <Link to="/" className="text-primary font-semibold hover:underline">latest breaking news in Dominica</Link>{" "}
            from Dominica News.
          </p>
        </aside>

        {/* ── Social Embeds ───────────────────────────────────────────────── */}
        {article.social_embeds && article.social_embeds.length > 0 && (
          <section className="mb-10 space-y-4">
            <h3 className="font-heading font-bold text-lg text-foreground border-b border-border pb-2">
              Related Content
            </h3>
            {article.social_embeds.map((embed, idx) => (
              <SocialEmbedRenderer
                key={idx}
                platform={embed.platform}
                embed_url={embed.embed_url}
                embed_code={embed.embed_code}
              />
            ))}
          </section>
        )}

        {/* ── About the Author ────────────────────────────────────────────── */}
        {article.authors && (
          <section className="mb-14 p-7 md:p-10 border border-border/40 rounded-3xl bg-muted/10 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <h3 className="font-heading font-bold text-xs text-muted-foreground uppercase tracking-widest mb-5">
              About the Author
            </h3>
            <div className="flex items-start gap-5">
              <div className="shrink-0">
                {article.authors.avatar_url ? (
                  <img
                    src={getProxiedAssetUrl(article.authors.avatar_url)}
                    alt={article.authors.full_name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.fallbackApplied === "true") { img.style.display = "none"; return; }
                      img.dataset.fallbackApplied = "true";
                      img.src = "/placeholder.svg";
                    }}
                    className="w-16 h-16 rounded-full object-cover border-2 border-border ring-2 ring-primary/10"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  {(article.authors as any).slug ? (
                    <Link
                      to={`/author/${(article.authors as any).slug}`}
                      className="font-heading font-bold text-foreground text-base hover:text-primary hover:underline"
                    >
                      {article.authors.full_name}
                    </Link>
                  ) : (
                    <span className="font-heading font-bold text-foreground text-base">
                      {article.authors.full_name}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-body uppercase tracking-wider">
                    {authorRole}
                  </span>
                </div>
                {article.authors.bio ? (
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">
                    {article.authors.bio}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground font-body italic">
                    No bio available.
                  </p>
                )}
                {(article.authors as any).slug && (
                  <Link
                    to={`/author/${(article.authors as any).slug}`}
                    className="inline-block mt-3 text-sm text-primary font-body font-semibold hover:underline"
                  >
                    View all articles by {article.authors.full_name} →
                  </Link>
                )}
              </div>
            </div>

            {moreFromAuthor.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border/60">
                <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                  You may have missed from {article.authors.full_name}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {moreFromAuthor.map((a) => (
                    <Link
                      key={a.id}
                      to={`/news/${a.slug}`}
                      className="group block rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/40 transition-colors"
                    >
                      {a.cover_image_url && (
                        <div className="aspect-video overflow-hidden bg-muted">
                          <img
                            src={a.cover_image_url}
                            alt={a.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <h5 className="font-heading font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {a.title}
                        </h5>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── SEO Internal Links ─────────────────────────────────────────── */}
        <section className="mb-10 animate-fade-in-up" style={{ animationDelay: "0.4s" }} aria-label="More from Dominica News">
          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">
              More from <Link to="/" className="text-primary hover:underline">Dominica News</Link>
            </h3>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              Stay updated with{" "}
              <Link to="/" className="text-primary hover:underline">breaking news in Dominica</Link>
              {" "}and follow the{" "}
              <Link to="/" className="text-primary hover:underline">latest Dominica news</Link>
              {" "}across{" "}
              <Link to={`/category/${categorySlug}`} className="text-primary hover:underline">{categoryName}</Link>,{" "}
              <Link to="/category/politics" className="text-primary hover:underline">Politics</Link>,{" "}
              <Link to="/category/business" className="text-primary hover:underline">Business</Link>,{" "}
              <Link to="/category/sports" className="text-primary hover:underline">Sports</Link>, and{" "}
              <Link to="/live" className="text-primary hover:underline">Live Updates</Link>{" "}
              from the Commonwealth of Dominica.
            </p>
          </div>
        </section>

        {/* ── Category FAQ (evergreen) ───────────────────────────────────── */}
        <ArticleFAQ categorySlug={categorySlug} />





        {/* ── Related Articles ────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mb-14 animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1 h-7 bg-primary rounded-full" />
              <h3 className="font-heading font-bold text-xl text-foreground tracking-tight">Related Articles</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {related.map((rel) => (
                <RelatedCard key={rel.id} article={rel} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default ArticlePage;
