import { useEffect, useState } from "react";
import { Users, FileText, UserCheck, Search, Eye, Edit, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { mongoApi, MongoAuthor } from "@/lib/mongoApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const generateSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-");

interface AuthorFormData {
  full_name: string;
  email: string;
  bio: string;
  role: string;
  location: string;
  is_active: boolean;
}

const emptyForm: AuthorFormData = {
  full_name: "",
  email: "",
  bio: "",
  role: "Reporter",
  location: "",
  is_active: true,
};

const AdminAuthorsPage = () => {
  const [authors, setAuthors] = useState<MongoAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<MongoAuthor | null>(null);
  const [form, setForm] = useState<AuthorFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadAuthors = () => {
    setLoading(true);
    mongoApi
      .getAuthors()
      .then(setAuthors)
      .catch(() => toast.error("Failed to load authors"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAuthors(); }, []);

  const filtered = authors.filter((a) =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalAuthors = authors.length;
  const activeAuthors = authors.filter((a) => a.is_active).length;
  const totalArticles = authors.reduce((sum, a) => sum + (a.articles_count || 0), 0);

  const openCreate = () => {
    setEditingAuthor(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (author: MongoAuthor) => {
    setEditingAuthor(author);
    setForm({
      full_name: author.full_name,
      email: author.email || "",
      bio: author.bio || "",
      role: author.role || "Reporter",
      location: author.location || "",
      is_active: author.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error("Name is required"); return; }
    setSubmitting(true);
    try {
      if (editingAuthor) {
        await mongoApi.updateAuthor(editingAuthor.id, {
          full_name: form.full_name.trim(),
          email: form.email.trim() || undefined,
          bio: form.bio.trim() || undefined,
          role: form.role.trim() || "Reporter",
          location: form.location.trim() || undefined,
          is_active: form.is_active,
        });
        toast.success("Author updated");
      } else {
        await mongoApi.createAuthor({
          full_name: form.full_name.trim(),
          email: form.email.trim() || undefined,
          bio: form.bio.trim() || undefined,
          role: form.role.trim() || "Reporter",
          location: form.location.trim() || undefined,
          is_active: form.is_active,
          slug: generateSlug(form.full_name),
        });
        toast.success("Author created");
      }
      setDialogOpen(false);
      loadAuthors();
    } catch (err: any) {
      toast.error(err.message || "Failed to save author");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (author: MongoAuthor) => {
    if (!confirm(`Delete "${author.full_name}"? This cannot be undone.`)) return;
    try {
      await mongoApi.deleteAuthor(author.id);
      toast.success("Author deleted");
      loadAuthors();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete author");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">Authors Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your editorial team and author profiles</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors w-full sm:w-auto"
        >
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

      {/* Authors List */}
      <div className="border border-border rounded-xl overflow-hidden">
        {/* Desktop table */}
        <table className="w-full text-sm hidden md:table">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Author</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Contact</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Articles</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Loading authors...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No authors found.</td></tr>
            ) : (
              filtered.map((author) => (
                <tr key={author.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {author.avatar_url ? (
                        <img src={author.avatar_url} alt={author.full_name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {author.email && <span className="flex items-center gap-1.5 text-xs"><span className="opacity-60">✉</span> {author.email}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">{author.articles_count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${author.is_active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {author.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(author)} className="p-1.5 hover:bg-muted rounded transition-colors" title="Edit">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(author)} className="p-1.5 hover:bg-destructive/10 rounded transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading authors...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No authors found.</div>
          ) : (
            filtered.map((author) => (
              <div key={author.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {author.avatar_url ? (
                      <img src={author.avatar_url} alt={author.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {getInitials(author.full_name)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground text-sm">{author.full_name}</p>
                      <p className="text-xs text-muted-foreground">{author.role}</p>
                    </div>
                  </div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${author.is_active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {author.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {author.email && <span>✉ {author.email}</span>}
                    <span>{author.articles_count} articles</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(author)} className="p-1.5 hover:bg-muted rounded transition-colors" title="Edit">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(author)} className="p-1.5 hover:bg-destructive/10 rounded transition-colors" title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Author Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingAuthor ? "Edit Author" : "Add New Author"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Full Name *</label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="e.g. Jane Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Role / Title</label>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Reporter"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Location</label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Roseau, Dominica"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Bio</label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Short biography..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                id="is_active"
                className="rounded border-border"
              />
              <label htmlFor="is_active" className="text-sm text-foreground">Active author</label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingAuthor ? "Save Changes" : "Create Author"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuthorsPage;
