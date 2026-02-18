import { useEffect, useState } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { mongoApi, MongoCategory } from "@/lib/mongoApi";

const NavBar = () => {
  const [categories, setCategories] = useState<MongoCategory[]>([]);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const activeCat = searchParams.get("cat");

  useEffect(() => {
    mongoApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  const isHomeActive = location.pathname === "/" && !activeCat;

  return (
    <nav className="sticky top-0 z-50 bg-background border-y border-border shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1 px-4 overflow-x-auto">
        {/* Home */}
        <Link
          to="/"
          className={`px-5 py-3 text-sm font-body font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
            isHomeActive
              ? "text-nav-active border-b-2 border-nav-active"
              : "text-foreground hover:bg-nav-hover"
          }`}
        >
          Home
        </Link>

        {/* Dynamic categories */}
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/?cat=${cat.slug}`}
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
