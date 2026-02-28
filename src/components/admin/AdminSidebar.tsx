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
    <div className="mb-1">
      {!collapsed && (
        <p className="text-[10px] font-body font-bold text-muted-foreground/60 uppercase tracking-[0.12em] px-3 pt-4 pb-1.5">
          {label}
        </p>
      )}
      {collapsed && <div className="border-t border-border my-2 mx-2" />}
      <ul className="space-y-px">
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
                  "flex items-center gap-2.5 px-3 py-1.5 rounded text-[13px] font-body font-medium transition-all duration-150 group relative",
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r" />
                )}
                <item.icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {!collapsed && <span>{item.title}</span>}
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
        "flex flex-col border-r border-border bg-card transition-all duration-200 flex-shrink-0 h-full",
        collapsed ? "w-[52px]" : "w-52"
      )}
    >
      {/* Brand header */}
      <div className="flex items-center gap-2 px-3 h-11 border-b border-border flex-shrink-0">
        <img src={dominicaLogo} alt="DN" className="h-6 w-6 rounded flex-shrink-0" />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-heading font-bold text-foreground leading-tight truncate">Dominica News</p>
            <p className="text-[10px] font-body text-muted-foreground leading-tight">CMS Admin</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-0.5 rounded hover:bg-muted text-muted-foreground transition-colors hidden md:flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1 px-1.5">
        <NavSection label="Editorial" items={mainNav} collapsed={collapsed} onNavigate={onNavigate} />
        <NavSection label="Content" items={contentNav} collapsed={collapsed} onNavigate={onNavigate} />
        <NavSection label="System" items={settingsNav} collapsed={collapsed} onNavigate={onNavigate} />
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-1.5">
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded text-[13px] font-body font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors w-full"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
