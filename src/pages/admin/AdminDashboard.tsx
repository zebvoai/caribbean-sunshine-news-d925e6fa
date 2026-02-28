import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Eye, Users, TrendingUp, PlusCircle, Clock,
  ArrowUpRight, Activity, Zap, Radio, Calendar, BarChart2,
  Sparkles, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mongoApi } from "@/lib/mongoApi";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { data: articles = [] } = useQuery({
    queryKey: ["admin-articles-count"],
    queryFn: () => mongoApi.getArticles({ limit: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: totalArticles = 0 } = useQuery({
    queryKey: ["dashboard-total-articles"],
    queryFn: async () => {
      const { count } = await supabase.from("articles").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
    staleTime: 60 * 1000,
  });

  const { data: totalViews = 0 } = useQuery({
    queryKey: ["dashboard-total-views"],
    queryFn: async () => {
      const { data } = await supabase.from("articles").select("view_count");
      return data?.reduce((sum, a) => sum + (a.view_count || 0), 0) ?? 0;
    },
    staleTime: 60 * 1000,
  });

  const { data: totalAuthors = 0 } = useQuery({
    queryKey: ["dashboard-total-authors"],
    queryFn: async () => {
      const { count } = await supabase.from("authors").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
    staleTime: 60 * 1000,
  });

  const { data: publishedCount = 0 } = useQuery({
    queryKey: ["dashboard-published-count"],
    queryFn: async () => {
      const { count } = await supabase.from("articles").select("*", { count: "exact", head: true }).eq("publication_status", "published");
      return count ?? 0;
    },
    staleTime: 60 * 1000,
  });

  const formatViews = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v);

  const statCards = [
    { label: "Total Articles", value: String(totalArticles), icon: FileText, color: "text-secondary", bgColor: "bg-secondary/8", borderColor: "border-secondary/15" },
    { label: "Total Views", value: formatViews(totalViews), icon: Eye, color: "text-primary", bgColor: "bg-primary/8", borderColor: "border-primary/15" },
    { label: "Authors", value: String(totalAuthors), icon: Users, color: "text-violet-600", bgColor: "bg-violet-50", borderColor: "border-violet-200/50" },
    { label: "Published", value: String(publishedCount), icon: TrendingUp, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200/50" },
  ];

  const quickActions = [
    { label: "New Article", description: "Write & publish", icon: FileText, path: "/admin/articles/create", accent: true },
    { label: "Breaking News", description: "Set alerts", icon: Zap, path: "/admin/breaking" },
    { label: "Live Update", description: "Real-time coverage", icon: Radio, path: "/admin/live" },
    { label: "Schedule", description: "Queue articles", icon: Calendar, path: "/admin/schedule" },
  ];

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id, title, publication_status, is_breaking, updated_at, published_at")
        .order("updated_at", { ascending: false })
        .limit(8);

      return (data || []).map((a) => {
        const type = a.is_breaking
          ? "breaking"
          : a.publication_status === "published"
          ? "publish"
          : a.publication_status === "scheduled"
          ? "scheduled"
          : "edit";

        const action = a.is_breaking
          ? "Breaking"
          : a.publication_status === "published"
          ? "Published"
          : a.publication_status === "scheduled"
          ? "Scheduled"
          : "Draft";

        const time = formatDistanceToNow(new Date(a.updated_at), { addSuffix: false });

        return { id: a.id, action, subject: a.title, time, type };
      });
    },
    staleTime: 30 * 1000,
  });

  const typeColors: Record<string, string> = {
    publish: "bg-primary/10 text-primary border border-primary/15",
    edit: "bg-muted text-muted-foreground border border-border/60",
    scheduled: "bg-secondary/10 text-secondary border border-secondary/15",
    breaking: "bg-destructive/10 text-destructive border border-destructive/15",
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-muted-foreground/70 mt-1 font-body">Overview of your editorial operations</p>
        </div>
        <button
          onClick={() => navigate("/admin/articles/create")}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-[13px] font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
        >
          <PlusCircle className="h-4 w-4" />
          New Article
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "bg-card border rounded-2xl px-5 py-4 flex items-center gap-4 transition-all hover:shadow-sm",
              stat.borderColor
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bgColor)}>
              <stat.icon className={cn("h-[18px] w-[18px]", stat.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground/60 font-body font-medium truncate uppercase tracking-wide">{stat.label}</p>
              <span className="text-2xl font-heading font-bold text-foreground leading-tight tabular-nums">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Actions */}
        <div className="bg-card border border-border/60 rounded-2xl p-5">
          <h2 className="text-[11px] font-body font-bold text-muted-foreground/50 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={cn(
                  "flex flex-col items-start gap-1.5 px-4 py-3.5 rounded-xl text-left transition-all duration-200 border group",
                  action.accent
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-sm"
                    : "bg-muted/20 text-foreground border-border/40 hover:bg-muted/50 hover:border-border"
                )}
              >
                <action.icon className={cn("h-4 w-4", action.accent ? "" : "text-muted-foreground")} />
                <div>
                  <span className="text-[13px] font-semibold font-body block leading-tight">{action.label}</span>
                  <span className={cn(
                    "text-[10px] font-body leading-tight",
                    action.accent ? "opacity-70" : "text-muted-foreground/60"
                  )}>{action.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card border border-border/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-body font-bold text-muted-foreground/50 uppercase tracking-[0.15em] flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Recent Activity
            </h2>
            <button onClick={() => navigate("/admin/articles")} className="text-[11px] text-primary hover:text-primary/80 font-semibold font-body flex items-center gap-1 transition-colors">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          {recentActivity.length === 0 ? (
            <div className="py-12 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground/50 font-body">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/20 -mx-2 px-2 rounded-xl transition-all duration-200 group"
                  onClick={() => navigate(`/admin/articles/edit/${item.id}`)}
                >
                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap", typeColors[item.type] || "bg-muted text-muted-foreground")}>
                    {item.action}
                  </span>
                  <p className="text-[13px] text-foreground truncate flex-1 min-w-0 font-body font-medium group-hover:text-primary transition-colors">{item.subject}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-muted-foreground/50 tabular-nums font-body">{item.time}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-primary/50 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent articles preview */}
      {articles.length > 0 && (
        <div className="mt-5 bg-card border border-border/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-body font-bold text-muted-foreground/50 uppercase tracking-[0.15em] flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              Latest Articles
            </h2>
            <button
              onClick={() => navigate("/admin/articles")}
              className="text-[11px] text-primary hover:text-primary/80 font-semibold font-body flex items-center gap-1 transition-colors"
            >
              Manage <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] font-body">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground/50">
                  <th className="text-left py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wide">Title</th>
                  <th className="text-left py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="text-left py-2.5 pr-4 font-semibold text-[11px] uppercase tracking-wide hidden md:table-cell">Category</th>
                  <th className="text-right py-2.5 font-semibold text-[11px] uppercase tracking-wide">Views</th>
                </tr>
              </thead>
              <tbody>
                {articles.slice(0, 5).map((article: any) => (
                  <tr
                    key={article.id || article._id}
                    className="hover:bg-muted/20 cursor-pointer transition-colors border-b border-border/20 last:border-b-0 group"
                    onClick={() => navigate(`/admin/articles/edit/${article.id || article._id}`)}
                  >
                    <td className="py-3 pr-4 text-foreground font-medium truncate max-w-[250px] group-hover:text-primary transition-colors">{article.title}</td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-lg border",
                        article.publication_status === "published"
                          ? "bg-primary/8 text-primary border-primary/15"
                          : article.publication_status === "scheduled"
                          ? "bg-secondary/8 text-secondary border-secondary/15"
                          : "bg-muted text-muted-foreground border-border/40"
                      )}>
                        {article.publication_status || "draft"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground/60 hidden md:table-cell truncate max-w-[120px]">
                      {article.primary_category?.name || "—"}
                    </td>
                    <td className="py-3 text-right tabular-nums text-muted-foreground/60">
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
