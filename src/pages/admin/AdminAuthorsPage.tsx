import { useEffect, useState, useRef } from "react";
import { Users, FileText, UserCheck, Search, Eye, Edit, Trash2, X, Loader2, Upload, Camera } from "lucide-react";
import { toast } from "sonner";
import { mongoApi, MongoAuthor } from "@/lib/mongoApi";
import { supabase } from "@/integrations/supabase/client";
import { getProxiedAssetUrl } from "@/lib/networkProxy";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  avatar_url: string;
}

const emptyForm: AuthorFormData = {
  full_name: "",
  email: "",
  bio: "",
  role: "Reporter",
  location: "",
  is_active: true,
  avatar_url: "",
};

const AdminAuthorsPage = () => {
  const [authors, setAuthors] = useState<MongoAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<MongoAuthor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MongoAuthor | null>(null);
  const [form, setForm] = useState<AuthorFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

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
      avatar_url: author.avatar_url || "",
    });
    setDialogOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, GIF, and WebP images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);
      const { data: urlData } = supabase.storage.from("article-images").getPublicUrl(path);
      setForm((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
      toast.success("Photo uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (avatarFileRef.current) avatarFileRef.current.value = "";
    }
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
          avatar_url: form.avatar_url.trim() || undefined,
        });
        toast.success("Author updated");
      } else {
        const authorPayload: Record<string, any> = {
          full_name: form.full_name.trim(),
          role: form.role.trim() || "Reporter",
          is_active: form.is_active,
          slug: generateSlug(form.full_name),
        };
        if (form.email.trim()) authorPayload.email = form.email.trim();
        if (form.bio.trim()) authorPayload.bio = form.bio.trim();
        if (form.location.trim()) authorPayload.location = form.location.trim();
        if (form.avatar_url.trim()) authorPayload.avatar_url = form.avatar_url.trim();
        await mongoApi.createAuthor(authorPayload as any);
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
    try {
      await mongoApi.deleteAuthor(author.id);
      toast.success("Author deleted");
      setDeleteTarget(null);
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
                      <button onClick={() => setDeleteTarget(author)} className="p-1.5 hover:bg-destructive/10 rounded transition-colors" title="Delete">
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
                    <button onClick={() => setDeleteTarget(author)} className="p-1.5 hover:bg-destructive/10 rounded transition-colors" title="Delete">
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
            {/* Avatar Photo */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Photo</label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {form.avatar_url ? (
                    <div className="relative">
                      <img
                        src={getProxiedAssetUrl(form.avatar_url)}
                        alt="Author photo"
                        className="w-16 h-16 rounded-full object-cover border-2 border-border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, avatar_url: "" })}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                      <Camera className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <input
                    ref={avatarFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    {uploadingAvatar ? "Uploading..." : "Upload photo"}
                  </button>
                  {form.avatar_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, avatar_url: "" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove photo
                    </button>
                  )}
                  <span className="text-[10px] text-muted-foreground">JPG, PNG, WebP — max 5MB</span>
                </div>
              </div>
            </div>

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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.full_name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this author. Articles by this author will not be deleted but will lose their author assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAuthorsPage;
