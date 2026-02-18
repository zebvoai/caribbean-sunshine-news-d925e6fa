import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Eye, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { mongoApi, MongoArticle } from "@/lib/mongoApi";

const STATUS_COLORS: Record<string, string> = {
  published: "bg-primary/10 text-primary",
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-secondary/10 text-secondary",
};

const AdminArticlesPage = () => {
  const [articles, setArticles] = useState<MongoArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await mongoApi.getArticles({
        status: filter !== "all" ? filter : undefined,
        limit: 100,
      });
      setArticles(data);
    } catch (err: any) {
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadArticles(); }, [filter]);

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Articles</h1>
          <p className="text-sm text-muted-foreground mt-1">{articles.length} total articles</p>
        </div>
        <Link
          to="/admin/articles/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          New Article
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {["all", "published", "draft", "scheduled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Title</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground hidden md:table-cell">Flags</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground hidden lg:table-cell">Date</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  Loading articles...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  No articles found.{" "}
                  <Link to="/admin/articles/create" className="text-primary hover:underline">
                    Create your first article
                  </Link>
                </td>
              </tr>
            ) : (
              filtered.map((article) => (
                <tr key={article.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground line-clamp-1">{article.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">/news/{article.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[article.publication_status] || "bg-muted text-muted-foreground"}`}>
                      {article.publication_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-1">
                      {article.is_breaking && <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive text-xs rounded font-medium">Breaking</span>}
                      {article.is_featured && <span className="px-1.5 py-0.5 bg-secondary/10 text-secondary text-xs rounded font-medium">Featured</span>}
                      {article.is_pinned && <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">Pinned</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString()
                      : article.created_at
                      ? new Date(article.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/news/${article.slug}`}
                        target="_blank"
                        className="p-1.5 hover:bg-muted rounded transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </a>
                      <button className="p-1.5 hover:bg-muted rounded transition-colors" title="Edit">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminArticlesPage;
