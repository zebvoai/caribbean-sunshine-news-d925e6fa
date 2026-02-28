import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Search, Menu, X, FileText, Tag, Users, FolderOpen, Settings, LayoutDashboard, Zap, Radio, Calendar, Trash2, BarChart3, BookOpen } from "lucide-react";
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
}

const searchItems: SearchItem[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, keywords: ["home", "overview"] },
  { label: "Articles", path: "/admin/articles", icon: FileText, keywords: ["posts", "content", "news"] },
  { label: "Create Article", path: "/admin/articles/create", icon: FileText, keywords: ["new", "write", "compose"] },
  { label: "Categories", path: "/admin/categories", icon: FolderOpen, keywords: ["topics", "sections"] },
  { label: "Authors", path: "/admin/authors", icon: Users, keywords: ["writers", "contributors", "team"] },
  { label: "Pages", path: "/admin/pages", icon: BookOpen, keywords: ["static", "about", "contact"] },
  { label: "Breaking News", path: "/admin/breaking", icon: Zap, keywords: ["urgent", "alert"] },
  { label: "Live Updates", path: "/admin/live", icon: Radio, keywords: ["blog", "realtime"] },
  { label: "Tags", path: "/admin/tags", icon: Tag, keywords: ["labels", "organize"] },
  { label: "Site Settings", path: "/admin/settings", icon: Settings, keywords: ["config", "preferences"] },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3, keywords: ["stats", "views", "traffic"] },
  { label: "Schedule", path: "/admin/schedule", icon: Calendar, keywords: ["publish", "queue"] },
  { label: "Recycle Bin", path: "/admin/trash", icon: Trash2, keywords: ["deleted", "restore"] },
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

  // ⌘K / Ctrl+K shortcut
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

  // Focus input when search opens
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
      <header className="h-11 flex items-center justify-between border-b border-border bg-card px-4 gap-3 flex-shrink-0">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Breadcrumb / title */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium">Admin</span>
          {title && (
            <>
              <span>/</span>
              <span className="text-foreground font-semibold">{title}</span>
            </>
          )}
        </div>

        {/* Search trigger */}
        <div className="flex items-center flex-1 max-w-xs ml-auto mr-2">
          <button
            onClick={openSearch}
            className="hidden sm:flex items-center gap-1.5 w-full border border-border rounded px-2.5 py-1 text-xs text-muted-foreground bg-background hover:border-ring/40 transition-colors cursor-pointer"
          >
            <Search className="h-3 w-3 flex-shrink-0" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="text-[10px] bg-muted border border-border rounded px-1 py-0.5 font-mono">⌘K</kbd>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={openSearch}
            className="sm:hidden p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary ml-1">
            A
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={closeSearch} />

          {/* Dialog */}
          <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, settings..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                onClick={closeSearch}
                className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No results found
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
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        idx === selectedIdx
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {isActive && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                          Current
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
              <span><kbd className="bg-muted border border-border rounded px-1 py-0.5 font-mono">↑↓</kbd> Navigate</span>
              <span><kbd className="bg-muted border border-border rounded px-1 py-0.5 font-mono">↵</kbd> Select</span>
              <span><kbd className="bg-muted border border-border rounded px-1 py-0.5 font-mono">Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminTopBar;
