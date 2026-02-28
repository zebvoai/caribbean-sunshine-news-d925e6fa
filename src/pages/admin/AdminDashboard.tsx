import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Eye, Users, TrendingUp, PlusCircle, Clock,
  ArrowUpRight, Activity, Zap, Radio, Calendar, BarChart2,
} from "lucide-react";
import { mongoApi } from "@/lib/mongoApi";
import { cn } from "@/lib/utils";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { data: articles = [] } = useQuery({
    queryKey: ["admin-articles-count"],
    queryFn: () => mongoApi.getArticles({ limit: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  const statCards = [
    { label: "Articles", value: "248", change: "+12", trend: "up", icon: FileText, color: "text-secondary" },
    { label: "Views (30d)", value: "24.5K", change: "+8%", trend: "up", icon: Eye, color: "text-primary" },
    { label: "Authors", value: "7", change: "+2", trend: "up", icon: Users, color: "text-violet-500" },
    { label: "Avg. Read", value: "3.2m", change: "+5%", trend: "up", icon: TrendingUp, color: "text-amber-500" },
  ];

  const quickActions = [
    { label: "New Article", icon: FileText, path: "/admin/articles/create", accent: true },
    { label: "Breaking News", icon: Zap, path: "/admin/breaking" },
    { label: "Live Update", icon: Radio, path: "/admin/live" },
    { label: "Schedule", icon: Calendar, path: "/admin/schedule" },
  ];

  const recentActivity = [
    { action: "Published", subject: "Chester 'Daddy Chess' Letang Crowned...", time: "2m", type: "publish" },
    { action: "Updated", subject: "Dominica Launches Minimum Wage Hotline...", time: "14m", type: "edit" },
    { action: "New author", subject: "Marcus James joined as contributor", time: "1h", type: "user" },
    { action: "Breaking", subject: "Tropical Storm Watch Issued...", time: "3h", type: "breaking" },
    { action: "Published", subject: "Agro-Processing Facility Opens...", time: "5h", type: "publish" },
  ];

  const typeColors: Record<string, string> = {
    publish: "bg-primary/15 text-primary",
    edit: "bg-secondary/15 text-secondary",
    user: "bg-violet-100 text-violet-600",
    breaking: "bg-accent/15 text-accent",
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Overview of your editorial operations</p>
        </div>
        <button
          onClick={() => navigate("/admin/articles/create")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          New Article
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3"
          >
            <div className={cn("p-2 rounded-md bg-muted/60", stat.color)}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium truncate">{stat.label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-heading font-bold text-foreground leading-tight">{stat.value}</span>
                <span className="text-[10px] font-semibold text-primary">{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-xs font-heading font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors border",
                  action.accent
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-background text-foreground border-border hover:bg-muted/60"
                )}
              >
                <action.icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-heading font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Recent Activity
            </h2>
            <button className="text-[10px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-0.5">
              View all <ArrowUpRight className="h-2.5 w-2.5" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", typeColors[item.type] || "bg-muted text-muted-foreground")}>
                  {item.action}
                </span>
                <p className="text-xs text-foreground truncate flex-1 min-w-0">{item.subject}</p>
                <span className="text-[10px] text-muted-foreground flex-shrink-0 tabular-nums">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent articles preview */}
      {articles.length > 0 && (
        <div className="mt-4 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-heading font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Latest Articles
            </h2>
            <button
              onClick={() => navigate("/admin/articles")}
              className="text-[10px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-0.5"
            >
              Manage <ArrowUpRight className="h-2.5 w-2.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1.5 pr-4 font-medium">Title</th>
                  <th className="text-left py-1.5 pr-4 font-medium hidden sm:table-cell">Status</th>
                  <th className="text-left py-1.5 pr-4 font-medium hidden md:table-cell">Category</th>
                  <th className="text-right py-1.5 font-medium">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {articles.slice(0, 5).map((article: any) => (
                  <tr
                    key={article.id || article._id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/articles/edit/${article.id || article._id}`)}
                  >
                    <td className="py-2 pr-4 text-foreground font-medium truncate max-w-[250px]">{article.title}</td>
                    <td className="py-2 pr-4 hidden sm:table-cell">
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        article.publication_status === "published"
                          ? "bg-primary/15 text-primary"
                          : article.publication_status === "scheduled"
                          ? "bg-secondary/15 text-secondary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {article.publication_status || "draft"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground hidden md:table-cell truncate max-w-[120px]">
                      {article.primary_category?.name || "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {(article.view_count || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
