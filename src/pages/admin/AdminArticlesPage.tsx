import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Eye, Edit, Trash2, Search, ArrowRight, FileText } from "lucide-react";
import { toast } from "sonner";
import { mongoApi, MongoArticle } from "@/lib/mongoApi";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_TABS = ["published", "draft", "scheduled"] as const;
type StatusTab = typeof STATUS_TABS[number];

const AdminArticlesPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<MongoArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("published");
  const [deleteTarget, setDeleteTarget] = useState<MongoArticle | null>(null);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await mongoApi.getArticles({ limit: 100 });
      setArticles(data);
    } catch {
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadArticles(); }, []);

  const counts = {
    published: articles.filter((a) => a.publication_status === "published").length,
    draft: articles.filter((a) => a.publication_status === "draft").length,
    scheduled: articles.filter((a) => a.publication_status === "scheduled").length,
  };

  const filtered = articles
    .filter((a) => a.publication_status === activeTab)
    .filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));

  const deleteArticle = async (article: MongoArticle) => {
    try {
      await mongoApi.deleteArticle(article.id);
      toast.success("Article deleted");
      setDeleteTarget(null);
      loadArticles();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const statusConfig = {
    published: { dot: "bg-primary", label: "Published" },
    draft: { dot: "bg-muted-foreground/40", label: "Drafts" },
    scheduled: { dot: "bg-secondary", label: "Scheduled" },
  };

  return (
    <div className="p-5 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground tracking-tight">Articles</h1>
          <p className="text-[13px] text-muted-foreground/70 mt-1 font-body">Manage all news articles</p>
        </div>
        <Link
          to="/admin/articles/create"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-[13px] font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md w-full sm:w-auto"
        >
          <PlusCircle className="h-4 w-4" />
          Create Article
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-muted/30 rounded-xl p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-[13px] font-semibold font-body rounded-lg transition-all duration-200",
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", statusConfig[tab].dot)} />
            {statusConfig[tab].label}
            <span className={cn(
              "text-[11px] font-bold px-1.5 py-0.5 rounded-md ml-0.5",
              activeTab === tab ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground/60"
            )}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full pl-10 pr-4 py-2.5 border border-border/60 rounded-xl text-[13px] font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 bg-muted/20 hover:bg-muted/30 transition-colors"
        />
      </div>

      {/* Article Cards */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/40 p-6 skeleton-shimmer h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground font-body">
          <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-base mb-3 font-heading">No {activeTab} articles found.</p>
          <Link to="/admin/articles/create" className="text-primary hover:underline text-sm inline-flex items-center gap-1">
            Create your first article <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="border border-border/40 rounded-2xl p-5 bg-card hover:border-primary/20 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Title + badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3
                      className="font-heading font-bold text-[15px] text-foreground leading-snug cursor-pointer group-hover:text-primary transition-colors"
                      onClick={() => navigate(`/admin/articles/edit/${article.id}`)}
                    >
                      {article.title}
                    </h3>
                    <span className={cn(
                      "inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold capitalize border",
                      article.publication_status === "published"
                        ? "bg-primary/8 text-primary border-primary/15"
                        : article.publication_status === "scheduled"
                        ? "bg-secondary/8 text-secondary border-secondary/15"
                        : "bg-muted text-muted-foreground border-border/40"
                    )}>
                      {article.publication_status}
                    </span>
                    {article.is_breaking && (
                      <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/15">
                        Breaking
                      </span>
                    )}
                    {article.is_featured && (
                      <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-secondary/8 text-secondary border border-secondary/15">
                        Featured
                      </span>
                    )}
                    {article.is_pinned && (
                      <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-muted text-muted-foreground border border-border/40">
                        Pinned
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <p className="text-[12px] text-muted-foreground/60 font-body mb-2 flex items-center gap-2">
                    <span>Dominica News</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : article.created_at
                        ? new Date(article.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.view_count}
                    </span>
                  </p>

                  {/* Excerpt */}
                  <p className="text-[13px] text-muted-foreground/70 font-body line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 self-end sm:self-start">
                  <button
                    onClick={() => navigate(`/admin/articles/edit/${article.id}`)}
                    className="p-2.5 hover:bg-muted/60 rounded-xl transition-all text-muted-foreground/60 hover:text-foreground"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(article)}
                    className="p-2.5 hover:bg-destructive/8 rounded-xl transition-all text-muted-foreground/40 hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Delete this article?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              "{deleteTarget?.title}" will be moved to the recycle bin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              onClick={() => deleteTarget && deleteArticle(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminArticlesPage;
