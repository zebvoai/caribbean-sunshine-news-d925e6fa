import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Eye, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { mongoApi, MongoArticle } from "@/lib/mongoApi";

const STATUS_TABS = ["published", "draft", "scheduled"] as const;
type StatusTab = typeof STATUS_TABS[number];

const AdminArticlesPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<MongoArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("published");

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

  const deleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await mongoApi.deleteArticle(id);
      toast.success("Article deleted");
      loadArticles();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Articles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all news articles</p>
        </div>
        <Link
          to="/admin/articles/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Create Article
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mt-5 mb-5 border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "published" && <span className="w-2 h-2 rounded-full bg-primary inline-block" />}
            {tab === "draft" && <span className="inline-flex items-center justify-center w-4 h-4"><svg viewBox="0 0 16 16" className="h-3.5 w-3.5 opacity-60"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg></span>}
            {tab === "scheduled" && <span className="inline-flex items-center justify-center w-4 h-4"><svg viewBox="0 0 16 16" className="h-3.5 w-3.5 opacity-60"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Article Cards */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5 bg-card animate-pulse h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground font-body">
          <p className="text-lg mb-3">No {activeTab} articles found.</p>
          <Link to="/admin/articles/create" className="text-primary hover:underline text-sm">
            Create your first article →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="border border-border rounded-xl p-5 bg-card hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title + badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold text-base text-foreground leading-snug">
                      {article.title}
                    </h3>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                      {article.publication_status}
                    </span>
                    {article.is_breaking && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-destructive text-destructive-foreground">
                        Breaking
                      </span>
                    )}
                    {article.is_featured && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary/10 text-secondary">
                        Featured
                      </span>
                    )}
                    {article.is_pinned && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                        Pinned
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <p className="text-xs text-muted-foreground font-body mb-2 flex items-center gap-1.5">
                    <span>Dominica News</span>
                    <span>•</span>
                    <span>
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
                        : article.created_at
                        ? new Date(article.created_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
                        : "—"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.view_count} views
                    </span>
                  </p>

                  {/* Excerpt */}
                  <p className="text-sm text-muted-foreground font-body line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/admin/articles/edit/${article.id}`)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteArticle(article.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminArticlesPage;
