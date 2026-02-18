import { useEffect, useState } from "react";
import { Users, FileText, UserCheck, Search, Eye, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { mongoApi, MongoAuthor } from "@/lib/mongoApi";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AdminAuthorsPage = () => {
  const [authors, setAuthors] = useState<MongoAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    mongoApi
      .getAuthors()
      .then(setAuthors)
      .catch(() => toast.error("Failed to load authors"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = authors.filter((a) =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalAuthors = authors.length;
  const activeAuthors = authors.filter((a) => a.is_active).length;
  const totalArticles = authors.reduce((sum, a) => sum + (a.articles_count || 0), 0);

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Authors Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your editorial team and author profiles</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
          <span className="text-base leading-none">+</span>
          Add Author
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-body mb-1">Total Authors</p>
            <p className="text-3xl font-heading font-bold text-foreground">{totalAuthors}</p>
          </div>
          <Users className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-body mb-1">Active Authors</p>
            <p className="text-3xl font-heading font-bold text-foreground">{activeAuthors}</p>
          </div>
          <UserCheck className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div className="border border-border rounded-xl p-5 bg-card flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-body mb-1">Total Articles</p>
            <p className="text-3xl font-heading font-bold text-foreground">{totalArticles}</p>
          </div>
          <FileText className="h-8 w-8 text-muted-foreground/40" />
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search authors..."
          className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Author</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground hidden md:table-cell">Contact</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Articles</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">Loading authors...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">No authors found.</td>
              </tr>
            ) : (
              filtered.map((author) => (
                <tr key={author.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {author.avatar_url ? (
                        <img
                          src={author.avatar_url}
                          alt={author.full_name}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(author.full_name)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground leading-tight">{author.full_name}</p>
                        <p className="text-xs text-muted-foreground">{author.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {author.email && (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="opacity-60">✉</span> {author.email}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                      {author.articles_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        author.is_active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {author.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 hover:bg-muted rounded transition-colors" title="View">
                        <Eye className="h-4 w-4 text-primary" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded transition-colors" title="Edit">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-destructive/10 rounded transition-colors" title="Delete">
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

export default AdminAuthorsPage;
