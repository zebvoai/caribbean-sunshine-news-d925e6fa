import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import NewsCard from "@/components/NewsCard";
import SiteFooter from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { mongoApi, MongoArticle } from "@/lib/mongoApi";
import { getProxiedAssetUrl } from "@/lib/networkProxy";
import type { NewsArticle } from "@/data/newsData";

const toNewsArticle = (a: MongoArticle): NewsArticle & { slug: string } => ({
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
  image: getProxiedAssetUrl(a.cover_image_url || ""),
  slug: a.slug,
});

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(queryFromUrl);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["search-articles", queryFromUrl],
    queryFn: () =>
      mongoApi.getArticles({ status: "published", limit: 20, q: queryFromUrl }),
    enabled: queryFromUrl.length >= 2,
    staleTime: 60 * 1000,
  });

  const mappedArticles = articles.map(toNewsArticle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length >= 2) {
      setSearchParams({ q: trimmed });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-6">
            Search Articles
          </h1>

          <form onSubmit={handleSubmit} className="relative max-w-xl mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title or keyword…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
          </form>

          {!queryFromUrl ? (
            <p className="text-muted-foreground font-body text-center py-16">
              Enter a search term to find articles.
            </p>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-lg bg-muted animate-pulse h-72" />
              ))}
            </div>
          ) : mappedArticles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-body">
              <p className="text-lg mb-2">
                No results found for "{queryFromUrl}"
              </p>
              <p className="text-sm">Try a different search term.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4 font-body">
                {mappedArticles.length} result{mappedArticles.length !== 1 ? "s" : ""} for "{queryFromUrl}"
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mappedArticles.map((article) => (
                  <Link key={article.slug} to={`/news/${article.slug}`} className="block">
                    <NewsCard article={article} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default SearchPage;
