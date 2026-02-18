import { Link } from "react-router-dom";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Caribbean", path: "/?cat=caribbean" },
  { label: "Dominica", path: "/?cat=dominica" },
  { label: "News", path: "/?cat=news" },
  { label: "Politics", path: "/?cat=politics" },
  { label: "Weather", path: "/?cat=weather" },
];

const NavBar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-background border-y border-border shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1 px-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`px-5 py-3 text-sm font-body font-semibold transition-colors ${
              item.label === "Home"
                ? "text-nav-active border-b-2 border-nav-active"
                : "text-foreground hover:bg-nav-hover"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default NavBar;
