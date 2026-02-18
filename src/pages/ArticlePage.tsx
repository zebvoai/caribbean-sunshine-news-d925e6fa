import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
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

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }) +
  " | " +
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

const truncate = (str: string, max: number) =>
  str.length > max ? str.slice(0, max) + "…" : str;

// ─── Related Article Card ────────────────────────────────────────────────────
const RelatedCard = ({ article }: { article: RelatedArticle }) => (
  <Link
    to={`/news/${article.slug}`}
    className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:shadow-card-hover transition-shadow duration-200"
  >
    <div className="aspect-[16/9] overflow-hidden bg-muted">
      {article.cover_image_url ? (
        <img
          src={article.cover_image_url}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-xs">No image</span>
        </div>
      )}
    </div>
    <div className="p-4 flex flex-col gap-2 flex-1">
      {article.categories && (
        <span className="text-xs font-semibold font-body uppercase tracking-wide text-primary">
          {article.categories.name}
        </span>
      )}
      <h3 className="text-sm font-heading font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
        {article.title}
      </h3>
      <p className="text-xs text-muted-foreground font-body line-clamp-2 flex-1">
        {article.excerpt}
      </p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-body mt-auto pt-2 border-t border-border">
        {article.authors && <span>{article.authors.full_name}</span>}
        {article.published_at && (
          <>
            {article.authors && <span>·</span>}
            <span>
              {new Date(article.published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
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
  const [loading, setLoading] = useState(true);
  const viewCounted = useRef(false);

  // ── Fetch article ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    viewCounted.current = false;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select(
          `id, title, slug, excerpt, body, cover_image_url, cover_image_alt,
           is_breaking, is_featured, is_pinned, meta_title, meta_description,
           published_at, view_count, primary_category_id,
           authors:author_id(id, full_name, avatar_url, bio, role),
           categories:primary_category_id(name, slug),
           social_embeds(platform, embed_url, embed_code)`
        )
        .eq("slug", slug)
        .eq("publication_status", "published")
        .single();

      if (error || !data) {
        setLoading(false);
        navigate("/404", { replace: true });
        return;
      }

      setArticle(data as unknown as Article);
      setLoading(false);
    };

    load();
  }, [slug, navigate]);

  // ── Increment view count (debounced, once per slug per page load) ───────────
  useEffect(() => {
    if (!article || viewCounted.current) return;
    const timer = setTimeout(async () => {
      if (viewCounted.current) return;
      viewCounted.current = true;
      await supabase.rpc("increment_article_view", { article_slug: article.slug });
    }, 3000); // 3-second delay as basic spam protection
    return () => clearTimeout(timer);
  }, [article]);

  // ── Fetch related articles ─────────────────────────────────────────────────
  useEffect(() => {
    if (!article) return;
    const fetchRelated = async () => {
      let results: RelatedArticle[] = [];

      // First: same primary category
      if (article.primary_category_id) {
        const { data } = await supabase
          .from("articles")
          .select(
            "id, title, slug, excerpt, cover_image_url, published_at, categories:primary_category_id(name), authors:author_id(full_name)"
          )
          .eq("publication_status", "published")
          .eq("primary_category_id", article.primary_category_id)
          .neq("id", article.id)
          .order("published_at", { ascending: false })
          .limit(6);
        results = (data as unknown as RelatedArticle[]) || [];
      }

      // Fill up to 6 with latest if needed
      if (results.length < 6) {
        const existingIds = [article.id, ...results.map((r) => r.id)];
        const needed = 6 - results.length;
        // Fetch more than needed and filter client-side to exclude already fetched
        const { data: fallback } = await supabase
          .from("articles")
          .select(
            "id, title, slug, excerpt, cover_image_url, published_at, categories:primary_category_id(name), authors:author_id(full_name)"
          )
          .eq("publication_status", "published")
          .order("published_at", { ascending: false })
          .limit(needed + existingIds.length + 5);
        if (fallback) {
          const filtered = (fallback as unknown as RelatedArticle[]).filter(
            (a) => !existingIds.includes(a.id)
          );
          results = [...results, ...filtered.slice(0, needed)];
        }
      }

      setRelated(results.slice(0, 6));
    };
    fetchRelated();
  }, [article]);

  // ── SEO meta tags ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!article) return;
    const title = article.meta_title || article.title;
    const description = article.meta_description || article.excerpt;
    const url = window.location.href;
    const image = article.cover_image_url || "";

    document.title = title + " | DominicaNews.dm";

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

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link") as HTMLLinkElement;
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // Article JSON-LD
    const schema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: title,
      description: description,
      image: image ? [image] : [],
      datePublished: article.published_at,
      author: article.authors
        ? [{ "@type": "Person", name: article.authors.full_name }]
        : [],
      publisher: {
        "@type": "Organization",
        name: "DominicaNews.dm",
      },
      url,
    };
    let ld = document.querySelector('script[type="application/ld+json"]');
    if (!ld) {
      ld = document.createElement("script");
      ld.setAttribute("type", "application/ld+json");
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(schema);

    return () => {
      document.title = "DominicaNews.dm";
    };
  }, [article]);

  // ── Share handlers ─────────────────────────────────────────────────────────
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const shareFacebook = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");

  const shareTwitter = () =>
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article?.title || "")}`,
      "_blank"
    );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!", description: "Article link copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Please copy the URL manually.", variant: "destructive" });
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <NavBar />
        <div className="max-w-4xl mx-auto px-6 py-16 space-y-6 animate-pulse">
          <div className="h-4 bg-muted rounded w-48" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-64 bg-muted rounded-xl" />
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
      <SiteHeader />
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <nav aria-label="breadcrumb" className="mb-5">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground font-body flex-wrap">
            <li>
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li>
              <Link
                to={`/?cat=${categorySlug}`}
                className="hover:text-primary transition-colors"
              >
                {categoryName}
              </Link>
            </li>
            <li>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li
              className="text-foreground font-medium max-w-xs truncate"
              aria-current="page"
            >
              {truncate(article.title, 50)}
            </li>
          </ol>
        </nav>

        {/* ── Badges ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {article.is_breaking && (
            <span className="inline-flex items-center gap-1.5 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded uppercase tracking-wide">
              <Zap className="h-3 w-3" />
              Breaking News
            </span>
          )}
          {article.is_featured && (
            <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded uppercase tracking-wide">
              <Star className="h-3 w-3" />
              Featured
            </span>
          )}
          {article.categories && (
            <Link
              to={`/?cat=${categorySlug}`}
              className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded hover:bg-primary/20 transition-colors"
            >
              {categoryName}
            </Link>
          )}
        </div>

        {/* ── Title ───────────────────────────────────────────────────────── */}
        <h1
          className={`text-3xl md:text-4xl font-heading font-bold text-foreground leading-tight mb-4 ${
            article.is_featured ? "text-secondary" : ""
          }`}
        >
          {article.title}
        </h1>

        {/* ── Excerpt ─────────────────────────────────────────────────────── */}
        <p className="text-lg text-muted-foreground font-body mb-4 leading-relaxed">
          {article.excerpt}
        </p>

        {/* ── Meta Row ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground font-body mb-5 pb-5 border-b border-border">
          <span className="font-semibold text-foreground">Dominica News</span>
          <span className="text-border">•</span>
          {pubDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {pubDate}
            </span>
          )}
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {article.view_count.toLocaleString()} views
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {readTime} min read
          </span>
          {article.authors && (
            <>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {article.authors.full_name}
              </span>
            </>
          )}
        </div>

        {/* ── Cover Image ─────────────────────────────────────────────────── */}
        {article.cover_image_url && (
          <figure className="mb-6 rounded-xl overflow-hidden shadow-card">
            <img
              src={article.cover_image_url}
              alt={article.cover_image_alt || article.title}
              className="w-full max-h-[480px] object-cover"
            />
            {article.cover_image_alt && (
              <figcaption className="text-xs text-muted-foreground text-center py-2 px-4 bg-muted/50">
                {article.cover_image_alt}
              </figcaption>
            )}
          </figure>
        )}

        {/* ── Share Bar ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8 py-4 border-y border-border">
          <span className="text-sm font-semibold font-body text-muted-foreground mr-1">Share:</span>
          <button
            onClick={shareFacebook}
            aria-label="Share on Facebook"
            className="flex items-center gap-1.5 text-sm font-body font-semibold px-3 py-1.5 rounded bg-[hsl(221_44%_41%)] text-white hover:opacity-90 transition-opacity"
          >
            <Facebook className="h-3.5 w-3.5" />
            Facebook
          </button>
          <button
            onClick={shareTwitter}
            aria-label="Share on Twitter"
            className="flex items-center gap-1.5 text-sm font-body font-semibold px-3 py-1.5 rounded bg-[hsl(203_89%_53%)] text-white hover:opacity-90 transition-opacity"
          >
            <Twitter className="h-3.5 w-3.5" />
            Twitter
          </button>
          <button
            onClick={copyLink}
            aria-label="Copy link"
            className="flex items-center gap-1.5 text-sm font-body font-semibold px-3 py-1.5 rounded border border-border text-foreground hover:bg-muted transition-colors"
          >
            <Link2 className="h-3.5 w-3.5" />
            Copy Link
          </button>
        </div>

        {/* ── Article Body ────────────────────────────────────────────────── */}
        <div
          className="
            prose prose-lg max-w-none font-body
            prose-headings:font-heading prose-headings:text-foreground
            prose-p:text-foreground prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
            prose-strong:text-foreground
            prose-img:rounded-lg prose-img:shadow-card
            prose-li:text-foreground
            mb-10
          "
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* ── Social Embeds ───────────────────────────────────────────────── */}
        {article.social_embeds && article.social_embeds.length > 0 && (
          <section className="mb-10 space-y-4">
            <h3 className="font-heading font-bold text-lg text-foreground border-b border-border pb-2">
              Related Content
            </h3>
            {article.social_embeds.map((embed, idx) => (
              <div
                key={idx}
                className="border border-border rounded-lg p-4 bg-muted/30"
              >
                {embed.embed_code ? (
                  <div dangerouslySetInnerHTML={{ __html: embed.embed_code }} />
                ) : (
                  <a
                    href={embed.embed_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline font-body"
                  >
                    <span className="uppercase font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {embed.platform}
                    </span>
                    <span className="truncate">{embed.embed_url}</span>
                  </a>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ── About the Author ────────────────────────────────────────────── */}
        {article.authors && (
          <section className="mb-10 p-5 border border-border rounded-xl bg-muted/20">
            <h3 className="font-heading font-bold text-base text-muted-foreground uppercase tracking-wide mb-4">
              About the Author
            </h3>
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                {article.authors.avatar_url ? (
                  <img
                    src={article.authors.avatar_url}
                    alt={article.authors.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-heading font-bold text-foreground text-base">
                    {article.authors.full_name}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary font-body">
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
              </div>
            </div>
          </section>
        )}

        {/* ── Related Articles ────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mb-10">
            <h3 className="font-heading font-bold text-xl text-foreground border-b-2 border-primary pb-2 mb-6">
              Related Articles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((rel) => (
                <RelatedCard key={rel.id} article={rel} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ArticlePage;
