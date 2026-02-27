import { useState } from "react";
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
  UserCog,
  Share2,
  Settings,
  BarChart2,
  Calendar,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  { title: "User Management", url: "/admin/users", icon: UserCog },
  { title: "Social Media", url: "/admin/social", icon: Share2 },
  { title: "Site Settings", url: "/admin/settings", icon: Settings },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart2 },
  { title: "Schedule", url: "/admin/schedule", icon: Calendar },
  { title: "Recycle Bin", url: "/admin/trash", icon: Trash2 },
];

interface NavSectionProps {
  label: string;
  items: typeof mainNav;
  collapsed: boolean;
}

const NavSection = ({ label, items, collapsed }: NavSectionProps) => {
  const location = useLocation();

  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-1">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = location.pathname === item.url;
          return (
            <li key={item.url}>
              <NavLink
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
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
}

const AdminSidebar = ({ collapsed, onToggle }: AdminSidebarProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    navigate("/admin/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-background transition-all duration-200 flex-shrink-0",
        collapsed ? "w-14" : "w-56"
      )}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-border">
        {!collapsed && (
          <div>
            <p className="text-base font-heading font-bold text-primary leading-tight">Admin</p>
            <p className="text-xs font-body text-muted-foreground">Dominica News</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <NavSection label="Main" items={mainNav} collapsed={collapsed} />
        <NavSection label="Content" items={contentNav} collapsed={collapsed} />
        <NavSection label="Settings" items={settingsNav} collapsed={collapsed} />
      </nav>
      <div className="border-t border-border p-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-body font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
