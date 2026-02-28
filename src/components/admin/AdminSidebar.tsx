import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Tag,
  Users,
  FileStack,
  Zap,
  Radio,
  Tags,
  Settings,
  BarChart2,
  Calendar,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Newspaper,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import dominicaLogo from "@/assets/dominica_logo.png";

const mainNav = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Articles", url: "/admin/articles", icon: FileText },
  { title: "Categories", url: "/admin/categories", icon: Tag },
  { title: "Authors", url: "/admin/authors", icon: Users },
];

const contentNav = [
  { title: "Pages", url: "/admin/pages", icon: FileStack },
  { title: "Breaking News", url: "/admin/breaking", icon: Zap },
  { title: "Live Updates", url: "/admin/live", icon: Radio },
  { title: "Tags", url: "/admin/tags", icon: Tags },
];

const settingsNav = [
  { title: "Site Settings", url: "/admin/settings", icon: Settings },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart2 },
  { title: "Schedule", url: "/admin/schedule", icon: Calendar },
  { title: "Recycle Bin", url: "/admin/trash", icon: Trash2 },
];

interface NavSectionProps {
  label: string;
  items: typeof mainNav;
  collapsed: boolean;
  onNavigate?: () => void;
}

const NavSection = ({ label, items, collapsed, onNavigate }: NavSectionProps) => {
  const location = useLocation();

  return (
    <div className="mb-2">
      {!collapsed && (
        <p className="text-[9px] font-body font-bold text-muted-foreground/50 uppercase tracking-[0.18em] px-3 pt-5 pb-2">
          {label}
        </p>
      )}
      {collapsed && <div className="border-t border-border/40 my-3 mx-3" />}
      <ul className="space-y-0.5 px-2">
        {items.map((item) => {
          const active =
            item.url === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(item.url);
          return (
            <li key={item.url}>
              <NavLink
                to={item.url}
                onClick={onNavigate}
                title={collapsed ? item.title : undefined}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-body font-medium transition-all duration-200 group relative",
                  active
                    ? "bg-primary/10 text-primary font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn(
                  "h-[15px] w-[15px] flex-shrink-0 transition-colors",
                  active ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"
                )} />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

const AdminSidebar = ({ collapsed, onToggle, onNavigate }: AdminSidebarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    onNavigate?.();
    navigate("/admin/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border/60 bg-card transition-all duration-300 ease-out flex-shrink-0 h-full relative",
        collapsed ? "w-[56px]" : "w-56"
      )}
    >
      {/* Brand header */}
      <div className="flex items-center gap-2.5 px-3 h-14 border-b border-border/60 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src={dominicaLogo} alt="DN" className="h-5 w-5 object-contain" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-heading font-bold text-foreground leading-tight truncate">Dominica News</p>
            <p className="text-[10px] font-body text-muted-foreground/60 leading-tight tracking-wide">CMS Admin</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded-lg hover:bg-muted/60 text-muted-foreground/60 hover:text-foreground transition-all hidden md:flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        <NavSection label="Editorial" items={mainNav} collapsed={collapsed} onNavigate={onNavigate} />
        <NavSection label="Content" items={contentNav} collapsed={collapsed} onNavigate={onNavigate} />
        <NavSection label="System" items={settingsNav} collapsed={collapsed} onNavigate={onNavigate} />
      </nav>

      {/* Footer */}
      <div className="border-t border-border/40 p-2 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 mb-1">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 font-body">
              <Sparkles className="h-3 w-3" />
              <span>v2.0 · Editorial CMS</span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-body font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all w-full"
        >
          <LogOut className="h-[15px] w-[15px] flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
