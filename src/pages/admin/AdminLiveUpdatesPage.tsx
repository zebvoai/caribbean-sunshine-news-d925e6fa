import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mongoApi, MongoLiveUpdate, CreateLiveUpdatePayload, LiveBlogEntry } from "@/lib/mongoApi";
import { toast } from "sonner";
import {
  Radio, PlusCircle, Search, Edit, Trash2, Eye, ArrowLeft, Save, Send, X,
  ChevronDown, ChevronUp, Pin, Clock, MessageSquarePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type View = "list" | "create" | "edit";

const AdminLiveUpdatesPage = () => {
  const qc = useQueryClient();
  const [view, setView] = useState<View>("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MongoLiveUpdate | null>(null);

  // ─── Form state ─────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [summary, setSummary] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverAlt, setCoverAlt] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [saving, setSaving] = useState(false);

  // ─── Entry posting state ────────────────────────────────────────────
  const [entryContent, setEntryContent] = useState("");
  const [entryImageUrl, setEntryImageUrl] = useState("");
  const [entryImageAlt, setEntryImageAlt] = useState("");
  const [postingEntry, setPostingEntry] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [entries, setEntries] = useState<LiveBlogEntry[]>([]);

  const resetForm = () => {
    setTitle(""); setSlug(""); setExcerpt(""); setSummary("");
    setCoverUrl(""); setCoverAlt(""); setIsLive(true);
    setEntryContent(""); setEntryImageUrl(""); setEntryImageAlt("");
    setEntries([]); setShowImageUpload(false);
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
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete"),
  });

  // ─── Handlers ───────────────────────────────────────────────────────
  const openCreate = () => { resetForm(); setView("create"); };

  const openEdit = async (id: string) => {
    try {
      const item = await mongoApi.getLiveUpdateById(id);
      setEditId(id);
      setTitle(item.title);
      setSlug(item.slug);
      setExcerpt(item.excerpt || "");
      setSummary(item.summary || "");
      setCoverUrl(item.cover_image_url || "");
      setCoverAlt(item.cover_image_alt || "");
      setIsLive(item.is_live);
      setEntries(item.entries || []);
      setView("edit");
    } catch {
      toast.error("Failed to load live update");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const payload: CreateLiveUpdatePayload = {
        title: title.trim(),
        slug: slug.trim() || title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        excerpt: excerpt.trim(),
        summary: summary.trim(),
        cover_image_url: coverUrl || null,
        cover_image_alt: coverAlt || null,
        is_live: isLive,
        publication_status: "published",
      };

      if (view === "edit" && editId) {
        await mongoApi.updateLiveUpdate(editId, payload);
        toast.success("Live update saved");
      } else {
        const { id } = await mongoApi.createLiveUpdate(payload);
        setEditId(id);
        setView("edit");
        toast.success("Live update created — start posting entries!");
      }
      qc.invalidateQueries({ queryKey: ["admin-live-updates"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePostEntry = async () => {
    if (!editId) return;
    if (!entryContent.trim() || entryContent === "<p></p>") {
      toast.error("Entry content is required");
      return;
    }
    setPostingEntry(true);
    try {
      const result = await mongoApi.addLiveEntry(editId, {
        content: entryContent,
        image_url: entryImageUrl || null,
        image_alt: entryImageAlt || null,
      });
      setEntries((prev) => [result.entry, ...prev]);
      setEntryContent("");
      setEntryImageUrl("");
      setEntryImageAlt("");
      setShowImageUpload(false);
      toast.success("Entry posted!");
    } catch (e: any) {
      toast.error(e.message || "Failed to post entry");
    } finally {
      setPostingEntry(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!editId) return;
    try {
      await mongoApi.deleteLiveEntry(editId, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast.success("Entry deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete entry");
    }
  };

  const handlePinEntry = async (entryId: string, pinned: boolean) => {
    if (!editId) return;
    try {
      await mongoApi.updateLiveEntry(editId, entryId, { is_pinned: pinned });
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, is_pinned: pinned } : e))
      );
      toast.success(pinned ? "Entry pinned" : "Entry unpinned");
    } catch (e: any) {
      toast.error(e.message || "Failed to update entry");
    }
  };

  const filtered = updates.filter((u) =>
    u.title.toLowerCase().includes(search.toLowerCase())
  );
  const liveCount = updates.filter((u) => u.is_live).length;
  const endedCount = updates.filter((u) => !u.is_live).length;

  // ─── Editor view ────────────────────────────────────────────────────
  if (view === "create" || view === "edit") {
    return (
      <div className="p-4 sm:p-6 max-w-4xl">
        <button
          onClick={() => { setView("list"); resetForm(); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Live Updates
        </button>

        <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-6">
          {view === "edit" ? "Edit Live Blog" : "Create Live Blog"}
        </h1>

        <div className="space-y-6">
          {/* Blog settings */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-base font-heading font-bold text-foreground">Blog Settings</h3>
            <div>
              <Label className="mb-1.5">Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Live blog title — e.g. Hurricane Maria Updates" />
            </div>
            <div>
              <Label className="mb-1.5">Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated-from-title" className="font-mono text-xs" />
            </div>
            <div>
              <Label className="mb-1.5">Excerpt / Summary Line</Label>
              <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Brief description shown on homepage..." rows={2} />
            </div>
            <div>
              <Label className="mb-1.5">Cover Image</Label>
              <ImageUploader
                imageUrl={coverUrl}
                imageAlt={coverAlt}
                onImageUrlChange={setCoverUrl}
                onImageAltChange={setCoverAlt}
              />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-background">
              <Switch checked={isLive} onCheckedChange={setIsLive} />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isLive ? "🔴 Currently LIVE" : "⚫ Ended"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isLive
                    ? "Readers see a pulsing LIVE badge and auto-refreshing entries"
                    : "Summary shown at top, timeline below. No LIVE badge."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : view === "edit" ? "Save Settings" : "Create & Start Posting"}
              </Button>
              <Button variant="outline" onClick={() => { setView("list"); resetForm(); }}>Cancel</Button>
            </div>
          </div>

          {/* Summary / Recap (shown when ended) */}
          {view === "edit" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="text-base font-heading font-bold text-foreground">
                Summary / Recap
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  (Shown at top when blog has ended)
                </span>
              </h3>
              <RichTextEditor value={summary} onChange={setSummary} />
            </div>
          )}

          {/* Post new entry */}
          {view === "edit" && editId && (
            <div className="bg-card border border-destructive/30 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
                <MessageSquarePlus className="h-5 w-5 text-destructive" />
                Post New Update
              </h3>
              <RichTextEditor value={entryContent} onChange={setEntryContent} />

              {showImageUpload ? (
                <div className="space-y-2">
                  <ImageUploader
                    imageUrl={entryImageUrl}
                    imageAlt={entryImageAlt}
                    onImageUrlChange={setEntryImageUrl}
                    onImageAltChange={setEntryImageAlt}
                  />
                  <button
                    type="button"
                    onClick={() => { setShowImageUpload(false); setEntryImageUrl(""); setEntryImageAlt(""); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowImageUpload(true)}
                  className="text-sm text-primary hover:underline"
                >
                  + Add image to this entry
                </button>
              )}

              <Button
                onClick={handlePostEntry}
                disabled={postingEntry}
                className="gap-2 bg-destructive hover:bg-destructive/90"
              >
                <Send className="h-4 w-4" />
                {postingEntry ? "Posting..." : "Post Entry"}
              </Button>
            </div>
          )}

          {/* Entries timeline */}
          {view === "edit" && entries.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Timeline ({entries.length} entries)
              </h3>
              <div className="relative border-l-2 border-destructive/20 ml-3 space-y-0">
                {entries.map((entry) => (
                  <div key={entry.id} className="relative pl-6 pb-6">
                    {/* Dot */}
                    <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-background ${
                      entry.is_pinned ? "bg-primary" : "bg-destructive/60"
                    }`} />

                    <div className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {new Date(entry.created_at).toLocaleTimeString("en-US", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                          <span>
                            {new Date(entry.created_at).toLocaleDateString("en-US", {
                              month: "short", day: "numeric",
                            })}
                          </span>
                          {entry.is_pinned && (
                            <span className="inline-flex items-center gap-1 text-primary font-semibold">
                              <Pin className="h-3 w-3" /> Pinned
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePinEntry(entry.id, !entry.is_pinned)}
                            className="p-1.5 hover:bg-muted rounded transition-colors"
                            title={entry.is_pinned ? "Unpin" : "Pin to top"}
                          >
                            <Pin className={`h-3.5 w-3.5 ${entry.is_pinned ? "text-primary" : "text-muted-foreground"}`} />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>

                      {entry.image_url && (
                        <img
                          src={entry.image_url}
                          alt={entry.image_alt || ""}
                          className="w-full max-h-64 object-cover rounded-lg mb-3"
                        />
                      )}

                      <div
                        className="prose prose-sm max-w-none text-foreground font-body"
                        dangerouslySetInnerHTML={{ __html: entry.content }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            Live Blogs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create BBC-style live blogs with real-time timeline entries
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-4 w-4" /> Create Live Blog
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
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search live blogs..." className="pl-9" />
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
          <p className="text-muted-foreground text-sm mb-2">No live blogs found.</p>
          <button onClick={openCreate} className="text-primary hover:underline text-sm">
            Create your first live blog →
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
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                        item.is_live
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.is_live && <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground animate-pulse" />}
                      {item.is_live ? "LIVE" : "ENDED"}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {item.entries_count || 0} entries
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body flex items-center gap-1.5">
                    <span>
                      Last updated:{" "}
                      {item.updated_at
                        ? new Date(item.updated_at).toLocaleString("en-US", {
                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
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
                  <Button variant="outline" size="sm" onClick={() => openEdit(item.id)} className="gap-1.5">
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <button
                    onClick={() => setDeleteTarget(item)}
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Live Blog</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>"{deleteTarget?.title}"</strong> and all its entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLiveUpdatesPage;
