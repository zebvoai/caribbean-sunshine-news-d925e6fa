import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mongoApi, MongoCategory } from "@/lib/mongoApi";
import { Layers, Pin, PinOff, Pencil, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";

const AdminCategoriesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<MongoCategory | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MongoCategory | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => mongoApi.getCategories(),
    staleTime: 2 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; slug: string; description?: string }) =>
      mongoApi.createCategory(payload),
    onSuccess: () => {
      invalidate();
      setIsCreateOpen(false);
      toast({ title: "Category created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<{ name: string; slug: string; description: string; is_pinned: boolean }>) =>
      mongoApi.updateCategory(id, payload),
    onSuccess: () => {
      invalidate();
      setEditingCategory(null);
      toast({ title: "Category updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mongoApi.deleteCategory(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast({ title: "Category deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setIsCreateOpen(true);
  };

  const openEdit = (cat: MongoCategory) => {
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || "");
    setEditingCategory(cat);
  };

  const handleCreate = () => {
    if (!formName.trim()) return;
    const slug = formSlug.trim() || formName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    createMutation.mutate({ name: formName.trim(), slug, description: formDescription.trim() });
  };

  const handleUpdate = () => {
    if (!editingCategory || !formName.trim()) return;
    updateMutation.mutate({
      id: editingCategory.id,
      name: formName.trim(),
      slug: formSlug.trim(),
      description: formDescription.trim(),
    });
  };

  const handleTogglePin = (cat: MongoCategory) => {
    updateMutation.mutate({ id: cat.id, is_pinned: !cat.is_pinned });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground font-body mt-1">Manage article categories</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

      {/* Category list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground font-body">
          <p className="text-lg mb-2">No categories yet.</p>
          <Button variant="outline" onClick={openCreate}>Create your first category</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="relative flex items-center gap-5 px-6 py-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
              onMouseEnter={() => setHoveredId(cat.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Icon */}
              <div className="flex-shrink-0 text-muted-foreground">
                <Layers className="h-8 w-8" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                  {cat.name}
                  {cat.is_pinned && (
                    <Pin className="h-3.5 w-3.5 text-primary fill-primary" />
                  )}
                </h3>
                <p className="text-sm text-muted-foreground font-body">
                  {cat.description || "No description"}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                    /{cat.slug}
                  </code>
                  <span className="text-muted-foreground text-xs">—</span>
                  <Badge variant="default" className="text-xs font-body">
                    {cat.articles_count} article{cat.articles_count !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>

              {/* Hover actions */}
              {hoveredId === cat.id && (
                <div className="flex items-center gap-1.5 absolute right-5 top-1/2 -translate-y-1/2">
                  <Button
                    size="icon"
                    variant={cat.is_pinned ? "default" : "outline"}
                    className="h-9 w-9"
                    onClick={() => handleTogglePin(cat)}
                    title={cat.is_pinned ? "Unpin" : "Pin"}
                  >
                    {cat.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9"
                    onClick={() => openEdit(cat)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setDeleteTarget(cat)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingCategory} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditingCategory(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-body font-medium text-foreground mb-1 block">Name</label>
              <Input
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (!editingCategory) {
                    setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                  }
                }}
                placeholder="Category name"
              />
            </div>
            <div>
              <label className="text-sm font-body font-medium text-foreground mb-1 block">Slug</label>
              <Input
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="category-slug"
              />
            </div>
            <div>
              <label className="text-sm font-body font-medium text-foreground mb-1 block">Description</label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingCategory(null); }}>
                Cancel
              </Button>
              <Button
                onClick={editingCategory ? handleUpdate : handleCreate}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category. Articles assigned to it will not be deleted but will lose their category assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCategoriesPage;
