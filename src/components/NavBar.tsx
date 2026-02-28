import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio } from "lucide-react";
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

  const { data: liveUpdates = [] } = useQuery({
    queryKey: ["live-updates-home"],
    queryFn: () => mongoApi.getLiveUpdates(),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const hasActiveLive = liveUpdates.some((u) => u.is_live);
  const isHomeActive = location.pathname === "/" && !activeCat;
  const isLiveActive = location.pathname === "/live";

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

  const linkBase =
    "relative px-4 py-4 text-[10.5px] font-body font-bold uppercase tracking-[0.14em] transition-all whitespace-nowrap flex-shrink-0";
  const activeClass = "text-primary after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:bg-primary after:rounded-full";
  const inactiveClass = "text-foreground/55 hover:text-primary";

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/30 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-0.5 px-4 overflow-x-auto scrollbar-hide">
        <Link
          to="/"
          onMouseEnter={() => prefetch(null)}
          className={`${linkBase} ${isHomeActive ? activeClass : inactiveClass}`}
        >
          Home
        </Link>

        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/?cat=${cat.slug}`}
            onMouseEnter={() => prefetch(cat.slug)}
            className={`${linkBase} ${activeCat === cat.slug ? activeClass : inactiveClass}`}
          >
            {cat.name}
          </Link>
        ))}

        <Link
          to="/live"
          className={`${linkBase} flex items-center gap-1.5 ${
            isLiveActive
              ? "text-destructive after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:bg-destructive after:rounded-full"
              : "text-foreground/55 hover:text-destructive"
          }`}
        >
          <span className="relative flex items-center">
            <Radio className="h-3.5 w-3.5" />
            {hasActiveLive && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
            )}
          </span>
          Live
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
