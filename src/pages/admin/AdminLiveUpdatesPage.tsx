import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mongoApi, MongoLiveUpdate, CreateLiveUpdatePayload } from "@/lib/mongoApi";
import { toast } from "sonner";
import {
  Radio,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type View = "list" | "create" | "edit";

const AdminLiveUpdatesPage = () => {
  const qc = useQueryClient();
  const [view, setView] = useState<View>("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // ─── Form state ─────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverAlt, setCoverAlt] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setBody("");
    setCoverUrl("");
    setCoverAlt("");
    setIsLive(true);
  };

  // ─── Queries ────────────────────────────────────────────────────────
  const { data: updates = [], isLoading } = useQuery({
    queryKey: ["admin-live-updates"],
    queryFn: () => mongoApi.getLiveUpdates(),
  });

  const toggleLiveMutation = useMutation({
    mutationFn: ({ id, is_live }: { id: string; is_live: boolean }) =>
      mongoApi.updateLiveUpdate(id, { is_live }),
    onSuccess: () => {
      toast.success("Live status updated");
      qc.invalidateQueries({ queryKey: ["admin-live-updates"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mongoApi.deleteLiveUpdate(id),
    onSuccess: () => {
      toast.success("Live update deleted");
      qc.invalidateQueries({ queryKey: ["admin-live-updates"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete"),
  });

  // ─── Handlers ───────────────────────────────────────────────────────
  const openCreate = () => {
    resetForm();
    setView("create");
  };

  const openEdit = async (id: string) => {
    try {
      const item = await mongoApi.getLiveUpdateById(id);
      setEditId(id);
      setTitle(item.title);
      setSlug(item.slug);
      setExcerpt(item.excerpt || "");
      setBody(item.body || "");
      setCoverUrl(item.cover_image_url || "");
      setCoverAlt(item.cover_image_alt || "");
      setIsLive(item.is_live);
      setView("edit");
    } catch {
      toast.error("Failed to load live update");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload: CreateLiveUpdatePayload = {
        title: title.trim(),
        slug: slug.trim() || title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        excerpt: excerpt.trim(),
        body,
        cover_image_url: coverUrl || null,
        cover_image_alt: coverAlt || null,
        is_live: isLive,
        publication_status: "published",
      };

      if (view === "edit" && editId) {
        await mongoApi.updateLiveUpdate(editId, payload);
        toast.success("Live update saved");
      } else {
        await mongoApi.createLiveUpdate(payload);
        toast.success("Live update created");
      }
      qc.invalidateQueries({ queryKey: ["admin-live-updates"] });
      setView("list");
      resetForm();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this live update?")) return;
    deleteMutation.mutate(id);
  };

  const filtered = updates.filter((u) =>
    u.title.toLowerCase().includes(search.toLowerCase())
  );

  const liveCount = updates.filter((u) => u.is_live).length;
  const endedCount = updates.filter((u) => !u.is_live).length;

  // ─── Editor view ────────────────────────────────────────────────────
  if (view === "create" || view === "edit") {
    return (
      <div className="p-4 sm:p-6 max-w-3xl">
        <button
          onClick={() => { setView("list"); resetForm(); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Live Updates
        </button>

        <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-6">
          {view === "edit" ? "Edit Live Update" : "Create Live Update"}
        </h1>

        <div className="space-y-5">
          <div>
            <Label className="mb-1.5">Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Live update title" />
          </div>

          <div>
            <Label className="mb-1.5">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated-from-title" />
          </div>

          <div>
            <Label className="mb-1.5">Excerpt / Summary</Label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Brief summary..." rows={2} />
          </div>

          <div>
            <Label className="mb-1.5">Body / Content</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Full content of the live update..." rows={10} className="font-mono text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5">Cover Image URL</Label>
              <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label className="mb-1.5">Cover Image Alt</Label>
              <Input value={coverAlt} onChange={(e) => setCoverAlt(e.target.value)} placeholder="Image description" />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
            <Switch checked={isLive} onCheckedChange={setIsLive} />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isLive ? "🔴 Currently LIVE" : "⚫ Not Live (Ended)"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isLive ? "This update is actively displayed with a LIVE tag" : "The update remains visible but the LIVE tag is greyed out"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : view === "edit" ? "Save Changes" : "Create Live Update"}
            </Button>
            <Button variant="outline" onClick={() => { setView("list"); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── List view ──────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Radio className="h-5 w-5 text-destructive" />
            Live Updates
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and manage live articles that can be edited in real-time
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-4 w-4" /> Create Live Update
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="font-semibold text-foreground">{liveCount}</span>
          <span className="text-muted-foreground">Live</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
          <span className="font-semibold text-foreground">{endedCount}</span>
          <span className="text-muted-foreground">Ended</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search live updates..."
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5 bg-card animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <Radio className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm mb-2">No live updates found.</p>
          <button onClick={openCreate} className="text-primary hover:underline text-sm">
            Create your first live update →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`border rounded-xl p-5 bg-card transition-colors ${
                item.is_live ? "border-destructive/30 hover:border-destructive/60" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold text-base text-foreground leading-snug">
                      {item.title}
                    </h3>
                    {/* LIVE tag — red when live, grey when ended */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                        item.is_live
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.is_live && (
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground animate-pulse" />
                      )}
                      {item.is_live ? "LIVE" : "ENDED"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body flex items-center gap-1.5">
                    <span>
                      Last updated:{" "}
                      {item.updated_at
                        ? new Date(item.updated_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {item.view_count} views
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground font-medium">Live</label>
                    <Switch
                      checked={item.is_live}
                      onCheckedChange={(checked) =>
                        toggleLiveMutation.mutate({ id: item.id, is_live: checked })
                      }
                      disabled={toggleLiveMutation.isPending}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(item.id)}
                    className="gap-1.5"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <button
                    onClick={() => handleDelete(item.id)}
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

export default AdminLiveUpdatesPage;
