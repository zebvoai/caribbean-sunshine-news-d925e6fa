import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mongoApi, MongoArticle } from "@/lib/mongoApi";
import { toast } from "sonner";
import { PlusCircle, Search, Zap, ZapOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const AdminBreakingNewsPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-breaking-articles"],
    queryFn: () => mongoApi.getArticles({ is_breaking: true, limit: 100 }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_breaking }: { id: string; is_breaking: boolean }) =>
      mongoApi.updateArticle(id, { is_breaking }),
    onSuccess: () => {
      toast.success("Breaking news status updated");
      qc.invalidateQueries({ queryKey: ["admin-breaking-articles"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update"),
  });

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-destructive" />
            Breaking News
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage articles tagged as breaking news
          </p>
        </div>
        <Button onClick={() => navigate("/admin/articles/create")} className="gap-2">
          <PlusCircle className="h-4 w-4" /> Create New Article
        </Button>
      </div>

      <div className="relative max-w-sm mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search breaking news..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5 bg-card animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <ZapOff className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm mb-2">No breaking news articles found.</p>
          <Link to="/admin/articles/create" className="text-primary hover:underline text-sm">
            Create a new article →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="border border-border rounded-xl p-5 bg-card hover:border-destructive/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold text-base text-foreground leading-snug">
                      {article.title}
                    </h3>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-destructive text-destructive-foreground">
                      BREAKING
                    </span>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                      {article.publication_status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body flex items-center gap-1.5">
                    <span>
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : article.created_at
                        ? new Date(article.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.view_count} views
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground font-medium">Breaking</label>
                    <Switch
                      checked={true}
                      onCheckedChange={() =>
                        toggleMutation.mutate({ id: article.id, is_breaking: false })
                      }
                      disabled={toggleMutation.isPending}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/articles/edit/${article.id}`)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBreakingNewsPage;
