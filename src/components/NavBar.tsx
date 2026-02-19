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
    staleTime: 30 * 60 * 1000, // categories rarely change
    gcTime: 60 * 60 * 1000,
  });

  const isHomeActive = location.pathname === "/" && !activeCat;

  // Prefetch category articles on hover for instant switching
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
    <nav className="sticky top-0 z-50 bg-background border-y border-border shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1 px-4 overflow-x-auto">
        <Link
          to="/"
          onMouseEnter={() => prefetch(null)}
          className={`px-5 py-3 text-sm font-body font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
            isHomeActive
              ? "text-nav-active border-b-2 border-nav-active"
              : "text-foreground hover:bg-nav-hover"
          }`}
        >
          Home
        </Link>

        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/?cat=${cat.slug}`}
            onMouseEnter={() => prefetch(cat.slug)}
            className={`px-5 py-3 text-sm font-body font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
              activeCat === cat.slug
                ? "text-nav-active border-b-2 border-nav-active"
                : "text-foreground hover:bg-nav-hover"
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
