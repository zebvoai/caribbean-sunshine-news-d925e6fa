import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mongoApi, MongoTag } from "@/lib/mongoApi";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tags, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

const emptyForm = { name: "", slug: "", color: "#3b82f6", description: "" };

const AdminTagsPage = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<MongoTag | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["admin-tags"],
    queryFn: () => mongoApi.getTags(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingTag) {
        await mongoApi.updateTag(editingTag.id, form);
      } else {
        await mongoApi.createTag(form);
      }
    },
    onSuccess: () => {
      toast.success(editingTag ? "Tag updated" : "Tag created");
      qc.invalidateQueries({ queryKey: ["admin-tags"] });
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mongoApi.deleteTag(id),
    onSuccess: () => {
      toast.success("Tag deleted");
      qc.invalidateQueries({ queryKey: ["admin-tags"] });
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete"),
  });

  const openCreate = () => {
    setEditingTag(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (tag: MongoTag) => {
    setEditingTag(tag);
    setForm({
      name: tag.name,
      slug: tag.slug,
      color: tag.color || "#3b82f6",
      description: tag.description || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTag(null);
    setForm(emptyForm);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: editingTag ? f.slug : generateSlug(name),
    }));
  };

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Tags className="h-5 w-5" /> Tags
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage custom tags for articles</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> New Tag
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <Tags className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No tags yet. Create your first tag.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {filtered.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 border border-border rounded-lg px-4 py-3 bg-card hover:border-primary/30 transition-colors group"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color || "#6b7280" }}
              />
              <span className="font-medium text-sm text-foreground">{tag.name}</span>
              <span className="text-xs text-muted-foreground font-mono">/{tag.slug}</span>
              <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tag)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(tag.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Create Tag"}</DialogTitle>
            <DialogDescription>
              {editingTag ? "Update the tag details." : "Create a new tag for organizing articles."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Name *</label>
              <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Politics" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Slug</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="politics" className="font-mono text-xs" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Color</label>
              <div className="flex items-center gap-2 mt-1">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description (optional)</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.name || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : editingTag ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
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

export default AdminTagsPage;
