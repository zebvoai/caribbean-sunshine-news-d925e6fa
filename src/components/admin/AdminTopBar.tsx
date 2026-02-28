import { Bell, Search, Menu, PanelLeftClose } from "lucide-react";
import { useLocation } from "react-router-dom";

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

const AdminTopBar = ({ onMenuToggle }: AdminTopBarProps) => {
  const location = useLocation();
  const title = routeTitles[location.pathname] || "";

  return (
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

      {/* Search */}
      <div className="flex items-center flex-1 max-w-xs ml-auto mr-2">
        <div className="hidden sm:flex items-center gap-1.5 w-full border border-border rounded px-2.5 py-1 text-xs text-muted-foreground bg-background hover:border-ring/40 transition-colors cursor-pointer">
          <Search className="h-3 w-3 flex-shrink-0" />
          <span className="flex-1">Search...</span>
          <kbd className="text-[10px] bg-muted border border-border rounded px-1 py-0.5 font-mono">⌘K</kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button className="relative p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold leading-none">3</span>
        </button>
        <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary ml-1">
          A
        </div>
      </div>
    </header>
  );
};

export default AdminTopBar;
