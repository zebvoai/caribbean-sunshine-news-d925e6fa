import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import { supabase } from "@/integrations/supabase/client";
import NewsCard from "@/components/NewsCard";
import type { NewsArticle } from "@/data/newsData";

interface DbArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  is_breaking: boolean;
  published_at: string | null;
  categories: { name: string } | null;
}

const toNewsArticle = (a: DbArticle): NewsArticle & { slug: string } => ({
  id: 0,
  title: a.title,
  excerpt: a.excerpt,
  category: a.categories?.name || "News",
  source: "Dominica News",
  date: a.published_at
    ? new Date(a.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "",
  image: a.cover_image_url || "",
  slug: a.slug,
});

const Index = () => {
  const [dbArticles, setDbArticles] = useState<DbArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, cover_image_url, is_breaking, published_at, categories:primary_category_id(name)")
        .eq("publication_status", "published")
        .order("published_at", { ascending: false })
        .limit(12);
      setDbArticles((data as DbArticle[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const articles = dbArticles.map(toNewsArticle);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-heading font-bold text-foreground mb-6">
          Latest News
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg bg-muted animate-pulse h-72" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-body">
            <p className="text-lg mb-3">No articles published yet.</p>
            <Link to="/admin/articles/create" className="text-primary hover:underline text-sm">
              Publish the first article →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, idx) => (
              <Link key={idx} to={`/news/${article.slug}`} className="block">
                <NewsCard article={article} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
