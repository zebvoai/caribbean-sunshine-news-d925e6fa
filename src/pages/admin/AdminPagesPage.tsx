import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mongoApi, MongoPage } from "@/lib/mongoApi";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, Eye, EyeOff, Search, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/admin/RichTextEditor";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

type View = "list" | "editor";

const emptyForm = { title: "", subtitle: "", slug: "", body: "", is_active: true, show_in_footer: true, display_order: 0 };

const AdminPagesPage = () => {
  const qc = useQueryClient();
  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");
  const [editingPage, setEditingPage] = useState<MongoPage | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: () => mongoApi.getPages(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mongoApi.deletePage(id),
    onSuccess: () => {
      toast.success("Page deleted");
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete"),
  });

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: editingPage ? f.slug : generateSlug(title),
    }));
  };

  const openCreate = () => {
    setEditingPage(null);
    setForm(emptyForm);
    setView("editor");
  };

  const openEdit = async (page: MongoPage) => {
    try {
      const full = await mongoApi.getPageById(page.id);
      setEditingPage(full);
      setForm({
        title: full.title,
        subtitle: full.subtitle || "",
        slug: full.slug,
        body: full.body,
        is_active: full.is_active,
        show_in_footer: full.show_in_footer,
        display_order: full.display_order,
      });
      setView("editor");
    } catch {
      toast.error("Failed to load page");
    }
  };

  const goBack = () => {
    setView("list");
    setEditingPage(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    setSaving(true);
    try {
      if (editingPage) {
        await mongoApi.updatePage(editingPage.id, form);
        toast.success("Page updated");
      } else {
        await mongoApi.createPage(form as any);
        toast.success("Page created");
      }
      qc.invalidateQueries({ queryKey: ["admin-pages"] });
      qc.invalidateQueries({ queryKey: ["footer-pages"] });
      goBack();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const filtered = pages.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Editor view ────────────────────────────────────────────────────
  if (view === "editor") {
    return (
      <div className="p-4 sm:p-6 max-w-4xl">
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Pages
        </button>

        <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-6">
          {editingPage ? "Edit Page" : "Create Page"}
        </h1>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <Label className="mb-1.5">Title *</Label>
              <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="About Us" />
            </div>
            <div>
              <Label className="mb-1.5">Subtitle (optional)</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Learn more about our team" />
            </div>
            <div>
              <Label className="mb-1.5">Slug *</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="about-us" className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground mt-1">URL: /page/{form.slug || "..."}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <Label className="mb-1.5">Page Content *</Label>
            <RichTextEditor value={form.body} onChange={(val) => setForm({ ...form, body: val })} />
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-base font-heading font-bold text-foreground mb-4">Visibility</h3>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.show_in_footer} onCheckedChange={(v) => setForm({ ...form, show_in_footer: v })} />
                <Label>Show in Footer</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : editingPage ? "Update Page" : "Create Page"}
            </Button>
            <Button variant="outline" onClick={goBack}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── List view ──────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Pages</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage static pages shown on your site and footer</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> New Page
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search pages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No pages yet. Create your first page.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Slug</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Footer</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Active</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((page) => (
                <tr key={page.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{page.title}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell font-mono text-xs">/{page.slug}</td>
                  <td className="px-4 py-3 text-center">
                    {page.show_in_footer ? <Eye className="h-4 w-4 text-primary mx-auto" /> : <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${page.is_active ? "bg-primary" : "bg-muted-foreground"}`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(page)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(page.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPagesPage;
