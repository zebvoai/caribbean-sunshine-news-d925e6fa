import { useQuery } from "@tanstack/react-query";
import { mongoApi, MongoArticle } from "@/lib/mongoApi";
import {
  BarChart2, Eye, FileText, TrendingUp, Users, Clock,
  ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer,
} from "recharts";

/* ── helpers ─────────────────────────────────────────────────────── */

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
      : String(n);

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 220 70% 50%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 160 60% 45%))",
  "hsl(var(--destructive))",
];

/* ── component ───────────────────────────────────────────────────── */

const AdminAnalyticsPage = () => {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["analytics-articles"],
    queryFn: () => mongoApi.getArticles({ limit: 500 }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["analytics-categories"],
    queryFn: () => mongoApi.getCategories(),
  });

  const { data: authors = [] } = useQuery({
    queryKey: ["analytics-authors"],
    queryFn: () => mongoApi.getAuthors(),
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  /* ── derived metrics ────────────────────────────────────────────── */

  const totalArticles = articles.length;
  const published = articles.filter((a) => a.publication_status === "published");
  const drafts = articles.filter((a) => a.publication_status === "draft");
  const scheduled = articles.filter((a) => a.publication_status === "scheduled");
  const totalViews = articles.reduce((s, a) => s + (a.view_count || 0), 0);
  const breakingCount = articles.filter((a) => a.is_breaking).length;
  const featuredCount = articles.filter((a) => a.is_featured).length;
  const avgViews = published.length ? Math.round(totalViews / published.length) : 0;

  /* ── top articles by views ──────────────────────────────────────── */

  const topArticles = [...articles]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 10);

  const topArticlesChart = topArticles.map((a) => ({
    name: a.title.length > 30 ? a.title.slice(0, 28) + "…" : a.title,
    views: a.view_count || 0,
  }));

  /* ── articles by category (pie) ─────────────────────────────────── */

  const catMap = new Map<string, string>();
  categories.forEach((c: any) => catMap.set(c.id, c.name));

  const byCategoryRaw: Record<string, number> = {};
  articles.forEach((a) => {
    const catName = a.primary_category_id ? catMap.get(a.primary_category_id) || "Uncategorized" : "Uncategorized";
    byCategoryRaw[catName] = (byCategoryRaw[catName] || 0) + 1;
  });
  const byCategoryData = Object.entries(byCategoryRaw)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  /* ── articles over time (last 12 months) ────────────────────────── */

  const now = new Date();
  const monthlyData: { month: string; count: number; views: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const monthStart = d.getTime();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    const inMonth = articles.filter((a) => {
      const t = a.published_at ? new Date(a.published_at).getTime() : a.created_at ? new Date(a.created_at).getTime() : 0;
      return t >= monthStart && t < monthEnd;
    });
    monthlyData.push({
      month: label,
      count: inMonth.length,
      views: inMonth.reduce((s, a) => s + (a.view_count || 0), 0),
    });
  }

  /* ── status distribution ────────────────────────────────────────── */

  const statusData = [
    { name: "Published", value: published.length },
    { name: "Drafts", value: drafts.length },
    { name: "Scheduled", value: scheduled.length },
  ].filter((d) => d.value > 0);

  /* ── stat cards ─────────────────────────────────────────────────── */

  const stats = [
    { label: "Total Articles", value: fmtNum(totalArticles), icon: FileText, sub: `${published.length} published` },
    { label: "Total Views", value: fmtNum(totalViews), icon: Eye, sub: `${fmtNum(avgViews)} avg per article` },
    { label: "Authors", value: String(authors.length), icon: Users, sub: `Contributing writers` },
    { label: "Breaking News", value: String(breakingCount), icon: TrendingUp, sub: `${featuredCount} featured` },
  ];

  const chartConfig = {
    views: { label: "Views", color: "hsl(var(--primary))" },
    count: { label: "Articles", color: "hsl(var(--chart-2, 220 70% 50%))" },
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <BarChart2 className="h-5 w-5" /> Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time overview of your site's content performance
        </p>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="border border-border rounded-xl p-5 bg-card flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground font-body mb-1">{s.label}</p>
              <p className="text-2xl font-heading font-bold text-foreground leading-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row 1 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Articles published over time */}
        <div className="border border-border rounded-xl p-6 bg-card">
          <h3 className="text-base font-heading font-bold mb-1">Articles Published</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 12 months</p>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Views over time */}
        <div className="border border-border rounded-xl p-6 bg-card">
          <h3 className="text-base font-heading font-bold mb-1">Views Over Time</h3>
          <p className="text-xs text-muted-foreground mb-4">Last 12 months</p>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ChartContainer>
        </div>
      </div>

      {/* ── Charts Row 2 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Category Distribution */}
        <div className="border border-border rounded-xl p-6 bg-card">
          <h3 className="text-base font-heading font-bold mb-1">By Category</h3>
          <p className="text-xs text-muted-foreground mb-4">Article distribution</p>
          {byCategoryData.length > 0 ? (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {byCategoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No category data</p>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="border border-border rounded-xl p-6 bg-card">
          <h3 className="text-base font-heading font-bold mb-1">Article Status</h3>
          <p className="text-xs text-muted-foreground mb-4">Current distribution</p>
          <div className="space-y-3 mt-6">
            {statusData.map((s) => {
              const pct = totalArticles ? Math.round((s.value / totalArticles) * 100) : 0;
              return (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="text-muted-foreground">{s.value} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Highlights */}
        <div className="border border-border rounded-xl p-6 bg-card">
          <h3 className="text-base font-heading font-bold mb-1">Content Highlights</h3>
          <p className="text-xs text-muted-foreground mb-4">Quick stats</p>
          <div className="space-y-4 mt-2">
            {[
              { label: "Categories", value: categories.length },
              { label: "Published", value: published.length },
              { label: "Drafts", value: drafts.length },
              { label: "Scheduled", value: scheduled.length },
              { label: "Featured", value: featuredCount },
              { label: "Breaking", value: breakingCount },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-heading font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Articles ─────────────────────────────────────────── */}
      <div className="border border-border rounded-xl p-6 bg-card">
        <h3 className="text-base font-heading font-bold mb-1">Top Articles by Views</h3>
        <p className="text-xs text-muted-foreground mb-4">Most viewed content</p>
        {topArticles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-semibold text-muted-foreground">#</th>
                  <th className="pb-2 font-semibold text-muted-foreground">Title</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-right">Views</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {topArticles.map((a, i) => (
                  <tr key={a.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5 font-medium text-foreground max-w-[300px] truncate">{a.title}</td>
                    <td className="py-2.5 text-right font-mono">{fmtNum(a.view_count || 0)}</td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                        a.publication_status === "published"
                          ? "bg-primary/10 text-primary"
                          : a.publication_status === "draft"
                            ? "bg-muted text-muted-foreground"
                            : "bg-accent/10 text-accent-foreground"
                      }`}>
                        {a.publication_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No articles yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
