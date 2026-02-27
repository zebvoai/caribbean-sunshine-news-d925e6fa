import { Bell, Sun, User, Search, Menu } from "lucide-react";

interface AdminTopBarProps {
  onMenuToggle?: () => void;
}

const AdminTopBar = ({ onMenuToggle }: AdminTopBarProps) => {
  return (
    <header className="h-12 flex items-center justify-between border-b border-border bg-background px-4 gap-3 flex-shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center flex-1 max-w-md">
        <div className="hidden sm:flex items-center gap-2 w-full border border-border rounded-md px-3 py-1.5 text-sm text-muted-foreground bg-muted/30">
          <Search className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-xs">Search articles, pages, settings...</span>
          <kbd className="text-xs bg-background border border-border rounded px-1 py-0.5">⌘K</kbd>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button className="relative p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">3</span>
        </button>
        <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
          <Sun className="h-4 w-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default AdminTopBar;
