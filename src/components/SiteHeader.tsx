import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import logoImg from "@/assets/dominica_logo.png";
import { Input } from "@/components/ui/input";
import DominicaInfoStrip from "@/components/DominicaInfoStrip";

const SiteHeader = () => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Dominica",
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
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-[10px] font-body font-semibold tracking-[0.15em] uppercase text-primary-foreground">
          <span className="opacity-90 flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/40 flex-shrink-0" />
            <span className="truncate">{today}</span>
          </span>
          <DominicaInfoStrip />
        </div>
      </div>

      {/* Main header */}
      <header className="bg-card border-b border-border/60 relative">
        <div className="flex items-center justify-between px-4 sm:px-6 py-5 md:py-7 max-w-7xl mx-auto">
          <div className="flex-1" />
          <Link to="/" className="text-center group relative">
            <img
              src={logoImg}
              alt="Dominica News"
              className="h-11 md:h-16 w-auto object-contain transition-all duration-500 group-hover:scale-[1.02] group-hover:brightness-110"
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
                  className="h-10 w-44 sm:w-60 text-sm rounded-full bg-muted/40 border-border/40 focus:bg-card focus:shadow-lg transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setQuery(""); }}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full transition-all"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-300"
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
