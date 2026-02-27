import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { mongoApi } from "@/lib/mongoApi";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";

const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["page", slug],
    queryFn: () => mongoApi.getPageBySlug(slug!),
    enabled: !!slug,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-12 font-body animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
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
