import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import { supabase } from "@/integrations/supabase/client";
import { newsArticles } from "@/data/newsData";
import type { NewsArticle } from "@/data/newsData";
import NewsCard from "@/components/NewsCard";

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

// Convert DB article to NewsArticle shape for NewsCard
const toNewsArticle = (a: DbArticle): NewsArticle & { slug?: string } => ({
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
  image: a.cover_image_url || newsArticles[0].image,
  slug: a.slug,
});

const Index = () => {
  const [dbArticles, setDbArticles] = useState<DbArticle[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, cover_image_url, is_breaking, published_at, categories:primary_category_id(name)")
        .eq("publication_status", "published")
        .order("published_at", { ascending: false })
        .limit(12);
      setDbArticles(data as DbArticle[] || []);
      setLoadingDb(false);
    };
    load();
  }, []);

  const hasDbArticles = dbArticles.length > 0;
  const displayArticles = hasDbArticles
    ? dbArticles.map(toNewsArticle)
    : newsArticles;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-heading font-bold text-foreground mb-6">
          Latest News
        </h2>
        {loadingDb ? (
          <div className="text-center py-12 text-muted-foreground">Loading news...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayArticles.map((article, idx) => {
              const slug = (article as any).slug;
              if (hasDbArticles && slug) {
                return (
                  <Link key={idx} to={`/news/${slug}`} className="block">
                    <NewsCard article={article} />
                  </Link>
                );
              }
              return <NewsCard key={idx} article={article} />;
            })}
          </div>
        )}
        {!hasDbArticles && !loadingDb && (
          <p className="text-xs text-muted-foreground text-center mt-6">
            Showing sample articles. <Link to="/admin/articles/create" className="text-primary hover:underline">Publish a real article</Link> to see it here.
          </p>
        )}
      </main>
    </div>
  );
};

export default Index;
