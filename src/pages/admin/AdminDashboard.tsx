import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, RefreshCw, FileText, Eye, Users, TrendingUp, PlusCircle, Clock, ImageIcon } from "lucide-react";
import { mongoApi } from "@/lib/mongoApi";
import { toast } from "sonner";

const statCards = [
  {
    label: "Total Articles",
    value: "248",
    change: "↑+12%",
    sub: "vs last month",
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    label: "Total Views",
    value: "24.5K",
    change: "↑+8%",
    sub: "This month",
    icon: Eye,
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
  },
  {
    label: "Active Authors",
    value: "7",
    change: "↑+2",
    sub: "New this month",
    icon: Users,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
  },
  {
    label: "Engagement",
    value: "94%",
    change: "↑+5%",
    sub: "Avg. read time: 3.2min",
    icon: TrendingUp,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
];

const quickActions = [
  { label: "New Article", icon: FileText, color: "bg-primary text-primary-foreground hover:bg-primary/90", path: "/admin/articles/create" },
  { label: "Add Author", icon: Users, color: "bg-secondary text-secondary-foreground hover:bg-secondary/90", path: "/admin/authors" },
  { label: "Breaking News", icon: PlusCircle, color: "bg-destructive text-destructive-foreground hover:bg-destructive/90", path: "/admin/breaking" },
  { label: "Schedule Post", icon: Clock, color: "bg-muted text-foreground hover:bg-muted/80", path: "/admin/schedule" },
];

const recentActivity = [
  { action: "New article published", subject: "Chester 'Daddy Chess' Letang Crowned...", time: "2 min ago", type: "publish" },
  { action: "Article updated", subject: "Dominica Launches Minimum Wage Hotline...", time: "14 min ago", type: "edit" },
  { action: "New author registered", subject: "Marcus James joined as contributor", time: "1 hr ago", type: "user" },
  { action: "Comment flagged", subject: "Flagged on Agro-Processing article", time: "2 hr ago", type: "flag" },
  { action: "Breaking news posted", subject: "Tropical Storm Watch Issued...", time: "3 hr ago", type: "breaking" },
];

const AdminDashboard = () => {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "testing">("connected");
  const [migrating, setMigrating] = useState(false);
  const navigate = useNavigate();

  const testConnection = () => {
    setConnectionStatus("testing");
    setTimeout(() => setConnectionStatus("connected"), 1500);
  };

  const migrateImages = async () => {
    setMigrating(true);
    try {
      const result = await mongoApi.migrateExternalImages(100);
      if (result.migrated > 0) {
        toast.success(`Migrated ${result.migrated} image(s) to storage.${result.failed ? ` ${result.failed} failed.` : ""}`);
      } else if (result.scanned === 0) {
        toast.info("All images are already in storage — nothing to migrate.");
      } else {
        toast.warning(`${result.failed} image(s) failed to migrate.`);
      }
    } catch (e: any) {
      toast.error(e.message || "Migration failed");
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's what's happening with your news site...</p>
      </div>



      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="border border-border rounded-lg p-5 bg-card flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground font-body mb-1">{stat.label}</p>
              <p className="text-2xl font-heading font-bold text-foreground leading-tight">
                {stat.value}
                <span className="text-xs font-body font-semibold text-primary ml-1">{stat.change}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </div>
            <div className={`p-2.5 rounded-lg flex-shrink-0 ${stat.iconBg}`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <div className="flex items-center gap-2 mb-1">
            <PlusCircle className="h-5 w-5 text-foreground" />
            <h2 className="text-base font-heading font-bold">Quick Actions</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Frequently used actions for faster workflow</p>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-body font-semibold transition-colors ${action.color}`}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-foreground" />
            <h2 className="text-base font-heading font-bold">Recent Activity</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Latest updates and changes</p>
          <ul className="space-y-3">
            {recentActivity.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-xs">{item.action}</p>
                  <p className="text-muted-foreground text-xs truncate">{item.subject}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
