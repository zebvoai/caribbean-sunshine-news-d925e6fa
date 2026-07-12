import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Home, Newspaper, ArrowRight, LayoutGrid } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import { mongoApi } from "@/lib/mongoApi";

const NotFound = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => mongoApi.getCategories(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const mainCategories = categories.filter(
    (cat) => (cat.articles_count ?? 0) > 0
  );

  return (
    <>
      <Helmet>
        <title>Page Not Found | Dominica News</title>
        <meta
          name="description"
          content="The page you requested could not be found. Browse the latest news from Dominica and the Caribbean, or explore our main categories."
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={window.location.origin + window.location.pathname} />
      </Helmet>

      <SiteHeader />
      <NavBar />

      <main className="min-h-[60vh] flex items-center justify-center bg-background relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-secondary/5 blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in-up">
          <span className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-6 shadow-sm">
            <Newspaper className="h-10 w-10" />
          </span>

          <h1 className="text-7xl sm:text-9xl font-heading font-bold text-primary tracking-tight mb-2">
            404
          </h1>
          <p className="text-2xl sm:text-3xl font-heading font-semibold text-foreground mb-4">
            Page not found
          </p>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            The article or page you are looking for may have been moved, renamed, or is no longer available.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              to="/category/news"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 focus-ring"
            >
              <Newspaper className="h-4 w-4" />
              Latest News
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-muted text-foreground font-body font-semibold text-sm hover:bg-muted/80 transition-all duration-300 hover:-translate-y-0.5 focus-ring"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          {mainCategories.length > 0 && (
            <div className="text-left">
              <div className="flex items-center gap-2 mb-4 justify-center sm:justify-start">
                <LayoutGrid className="h-4 w-4 text-primary" />
                <h2 className="font-heading font-semibold text-sm uppercase tracking-[0.12em] text-foreground">
                  Main categories
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {mainCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="group flex items-center justify-between p-4 rounded-2xl bg-card border border-border/60 shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all duration-300 card-lift"
                  >
                    <span className="font-body font-medium text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
};

export default NotFound;
