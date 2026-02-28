import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Search, Menu, X, FileText, Tag, Users, FolderOpen, Settings, LayoutDashboard, Zap, Radio, Calendar, Trash2, BarChart3, BookOpen, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface AdminTopBarProps {
  onMenuToggle?: () => void;
}

const routeTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/articles": "Articles",
  "/admin/articles/create": "Create Article",
  "/admin/categories": "Categories",
  "/admin/authors": "Authors",
  "/admin/pages": "Pages",
  "/admin/breaking": "Breaking News",
  "/admin/live": "Live Updates",
  "/admin/tags": "Tags",
  "/admin/settings": "Site Settings",
  "/admin/analytics": "Analytics",
  "/admin/schedule": "Schedule",
  "/admin/trash": "Recycle Bin",
};

interface SearchItem {
  label: string;
  path: string;
  icon: React.ElementType;
  keywords: string[];
  group: string;
}

const searchItems: SearchItem[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, keywords: ["home", "overview"], group: "Editorial" },
  { label: "Articles", path: "/admin/articles", icon: FileText, keywords: ["posts", "content", "news"], group: "Editorial" },
  { label: "Create Article", path: "/admin/articles/create", icon: FileText, keywords: ["new", "write", "compose"], group: "Editorial" },
  { label: "Categories", path: "/admin/categories", icon: FolderOpen, keywords: ["topics", "sections"], group: "Editorial" },
  { label: "Authors", path: "/admin/authors", icon: Users, keywords: ["writers", "contributors", "team"], group: "Editorial" },
  { label: "Pages", path: "/admin/pages", icon: BookOpen, keywords: ["static", "about", "contact"], group: "Content" },
  { label: "Breaking News", path: "/admin/breaking", icon: Zap, keywords: ["urgent", "alert"], group: "Content" },
  { label: "Live Updates", path: "/admin/live", icon: Radio, keywords: ["blog", "realtime"], group: "Content" },
  { label: "Tags", path: "/admin/tags", icon: Tag, keywords: ["labels", "organize"], group: "Content" },
  { label: "Site Settings", path: "/admin/settings", icon: Settings, keywords: ["config", "preferences"], group: "System" },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3, keywords: ["stats", "views", "traffic"], group: "System" },
  { label: "Schedule", path: "/admin/schedule", icon: Calendar, keywords: ["publish", "queue"], group: "System" },
  { label: "Recycle Bin", path: "/admin/trash", icon: Trash2, keywords: ["deleted", "restore"], group: "System" },
];

const AdminTopBar = ({ onMenuToggle }: AdminTopBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const title = routeTitles[location.pathname] || "";
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? searchItems.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.includes(q))
        );
      })
    : searchItems;

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setQuery("");
    setSelectedIdx(0);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (searchOpen) closeSearch();
        else openSearch();
      }
      if (e.key === "Escape" && searchOpen) {
        closeSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen, openSearch, closeSearch]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const handleSelect = (path: string) => {
    navigate(path);
    closeSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIdx]) {
      handleSelect(filtered[selectedIdx].path);
    }
  };

  return (
    <>
      <header className="h-14 flex items-center justify-between border-b border-border/60 bg-card px-4 md:px-6 gap-4 flex-shrink-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Breadcrumb / title */}
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-muted-foreground/60 font-body">Admin</span>
          {title && (
            <>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-foreground font-semibold font-body">{title}</span>
            </>
          )}
        </div>

        {/* Search trigger */}
        <div className="flex items-center flex-1 max-w-xs ml-auto mr-2">
          <button
            onClick={openSearch}
            className="hidden sm:flex items-center gap-2 w-full border border-border/60 rounded-xl px-3.5 py-2 text-[13px] text-muted-foreground/60 bg-muted/20 hover:bg-muted/40 hover:border-border transition-all duration-200 cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="text-[10px] bg-card border border-border/60 rounded-md px-1.5 py-0.5 font-mono text-muted-foreground/50">⌘K</kbd>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={openSearch}
            className="sm:hidden p-1.5 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary border border-primary/10">
            A
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={closeSearch} />

          <div className="relative w-full max-w-lg mx-4 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
              <Search className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, settings..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none font-body"
              />
              <button
                onClick={closeSearch}
                className="p-1 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground/60"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground/60 font-body">
                  No results found for "{query}"
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleSelect(item.path)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-150 ${
                        idx === selectedIdx
                          ? "bg-primary/8 text-primary"
                          : "text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        idx === selectedIdx ? "bg-primary/10" : "bg-muted/50"
                      }`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-medium font-body">{item.label}</span>
                        <span className="text-[10px] text-muted-foreground/50 ml-2 font-body">{item.group}</span>
                      </div>
                      {isActive && (
                        <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold tracking-wide uppercase">
                          Current
                        </span>
                      )}
                      {idx === selectedIdx && (
                        <ArrowRight className="h-3 w-3 text-primary/50" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-5 py-3 border-t border-border/40 text-[10px] text-muted-foreground/40 font-body">
              <span><kbd className="bg-muted/60 border border-border/40 rounded-md px-1.5 py-0.5 font-mono">↑↓</kbd> Navigate</span>
              <span><kbd className="bg-muted/60 border border-border/40 rounded-md px-1.5 py-0.5 font-mono">↵</kbd> Select</span>
              <span><kbd className="bg-muted/60 border border-border/40 rounded-md px-1.5 py-0.5 font-mono">Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminTopBar;
