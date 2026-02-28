import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import logoImg from "@/assets/dominica_logo.png";
import { Input } from "@/components/ui/input";

const SiteHeader = () => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

  return (
    <>
      {/* Top accent bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between text-[11px] font-body font-medium tracking-wide uppercase">
          <span className="opacity-90">{today}</span>
          <span className="hidden sm:inline opacity-90">Your Trusted Caribbean News Source</span>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-card border-b border-border relative">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 md:py-5 max-w-7xl mx-auto">
          <div className="flex-1" />
          <Link to="/" className="text-center group relative">
            <img
              src={logoImg}
              alt="DominicaNews.DM"
              className="h-10 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </Link>
          <div className="flex-1 flex justify-end">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 animate-fade-in">
                <Input
                  type="search"
                  placeholder="Search articles…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 w-40 sm:w-56 text-sm rounded-full bg-muted/50 border-border/50 focus:bg-card"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setQuery(""); }}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full transition-all"
                aria-label="Search articles"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default SiteHeader;
