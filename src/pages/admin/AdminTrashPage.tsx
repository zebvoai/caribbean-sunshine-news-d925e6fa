import { useEffect, useState } from "react";
import { Trash2, RotateCcw, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { mongoApi, MongoArticle } from "@/lib/mongoApi";

type TrashedArticle = MongoArticle & { deleted_at: string | null };

const AdminTrashPage = () => {
  const [articles, setArticles] = useState<TrashedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setArticles(await mongoApi.getTrashedArticles());
    } catch {
      toast.error("Failed to load trash");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const restore = async (id: string) => {
    try {
      await mongoApi.restoreArticle(id);
      toast.success("Article restored");
      load();
    } catch {
      toast.error("Failed to restore");
    }
  };

  const permanentDelete = async (id: string) => {
    if (!confirm("Permanently delete this article? This cannot be undone.")) return;
    try {
      await mongoApi.permanentlyDeleteArticle(id);
      toast.success("Permanently deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const emptyTrash = async () => {
    if (!confirm(`Permanently delete all ${articles.length} trashed articles? This cannot be undone.`)) return;
    try {
      await Promise.all(articles.map((a) => mongoApi.permanentlyDeleteArticle(a.id)));
      toast.success("Trash emptied");
      load();
    } catch {
      toast.error("Failed to empty trash");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Recycle Bin
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {articles.length} article{articles.length !== 1 ? "s" : ""} in trash
          </p>
        </div>
        {articles.length > 0 && (
          <button
            onClick={emptyTrash}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:bg-destructive/90 transition-colors w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            Empty Trash
          </button>
        )}
      </div>

      {/* Search */}
      {articles.length > 0 && (
        <div className="relative max-w-sm mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trashed articles..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5 bg-card animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground font-body">
          <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg mb-1">Recycle bin is empty</p>
          <p className="text-sm">Deleted articles will appear here before permanent removal.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="border border-border rounded-xl p-5 bg-card hover:border-destructive/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold text-base text-foreground leading-snug">
                      {article.title}
                    </h3>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
                      Deleted
                    </span>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground capitalize">
                      was {article.publication_status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground font-body mb-2 flex items-center gap-1.5">
                    <span>Deleted</span>
                    <span>
                      {article.deleted_at
                        ? new Date(article.deleted_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                  </p>

                  <p className="text-sm text-muted-foreground font-body line-clamp-1 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 self-end sm:self-start">
                  <button
                    onClick={() => restore(article.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Restore"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Restore</span>
                  </button>
                  <button
                    onClick={() => permanentDelete(article.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Delete permanently"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete Forever</span>
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

export default AdminTrashPage;
