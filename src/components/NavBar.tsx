import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mongoApi } from "@/lib/mongoApi";

const NavBar = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const activeCat = searchParams.get("cat");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => mongoApi.getCategories(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const isHomeActive = location.pathname === "/" && !activeCat;

  const prefetch = (slug: string | null) => {
    const key = slug || "home";
    queryClient.prefetchQuery({
      queryKey: ["articles", key],
      queryFn: () => {
        const params: Parameters<typeof mongoApi.getArticles>[0] = {
          status: "published",
          limit: 12,
        };
        if (slug) params.category_slug = slug;
        return mongoApi.getArticles(params);
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-0 px-4 overflow-x-auto">
        <Link
          to="/"
          onMouseEnter={() => prefetch(null)}
          className={`px-4 py-3 text-[13px] font-body font-semibold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0 border-b-2 ${
            isHomeActive
              ? "text-accent border-accent"
              : "text-foreground border-transparent hover:text-accent hover:border-accent/40"
          }`}
        >
          Home
        </Link>

        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/?cat=${cat.slug}`}
            onMouseEnter={() => prefetch(cat.slug)}
            className={`px-4 py-3 text-[13px] font-body font-semibold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0 border-b-2 ${
              activeCat === cat.slug
                ? "text-accent border-accent"
                : "text-foreground border-transparent hover:text-accent hover:border-accent/40"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default NavBar;
