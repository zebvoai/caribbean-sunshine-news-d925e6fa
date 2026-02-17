import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import { Calendar, User, ArrowLeft, Zap } from "lucide-react";

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
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  authors: { full_name: string; avatar_url: string | null } | null;
  categories: { name: string; slug: string } | null;
  social_embeds: { platform: string; embed_url: string | null; embed_code: string | null }[];
}

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          id, title, slug, excerpt, body, cover_image_url, cover_image_alt,
          is_breaking, is_featured, meta_title, meta_description, published_at,
          authors:author_id(full_name, avatar_url),
          categories:primary_category_id(name, slug),
          social_embeds(platform, embed_url, embed_code)
        `)
        .eq("slug", slug)
        .eq("publication_status", "published")
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setArticle(data as unknown as Article);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <NavBar />
        <div className="flex items-center justify-center py-24 text-muted-foreground">Loading article...</div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <NavBar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-heading font-bold mb-4">Article Not Found</h1>
          <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const pubDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Breaking badge */}
        {article.is_breaking && (
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded">
              <Zap className="h-3 w-3" />
              BREAKING NEWS
            </span>
          </div>
        )}

        {/* Category */}
        {article.categories && (
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded mb-3">
            {article.categories.name}
          </span>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground leading-tight mb-4">
          {article.title}
        </h1>

        {/* Excerpt */}
        <p className="text-lg text-muted-foreground font-body mb-6 leading-relaxed">{article.excerpt}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
          {article.authors && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {article.authors.full_name}
            </span>
          )}
          {pubDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {pubDate}
            </span>
          )}
        </div>

        {/* Cover Image */}
        {article.cover_image_url && (
          <figure className="mb-8 rounded-xl overflow-hidden">
            <img
              src={article.cover_image_url}
              alt={article.cover_image_alt || article.title}
              className="w-full max-h-96 object-cover"
            />
            {article.cover_image_alt && (
              <figcaption className="text-xs text-muted-foreground text-center mt-2">
                {article.cover_image_alt}
              </figcaption>
            )}
          </figure>
        )}

        {/* Body */}
        <div
          className="prose prose-lg max-w-none font-body [&_h1]:font-heading [&_h2]:font-heading [&_h3]:font-heading"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* Social Embeds */}
        {article.social_embeds && article.social_embeds.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="font-heading font-bold text-lg text-foreground">Related Content</h3>
            {article.social_embeds.map((embed, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4">
                {embed.embed_code ? (
                  <div dangerouslySetInnerHTML={{ __html: embed.embed_code }} />
                ) : (
                  <a
                    href={embed.embed_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <span className="uppercase font-semibold text-xs">{embed.platform}</span>
                    {" → "}
                    {embed.embed_url}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ArticlePage;
