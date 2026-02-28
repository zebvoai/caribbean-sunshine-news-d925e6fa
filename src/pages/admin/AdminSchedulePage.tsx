import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mongoApi, MongoArticle, MongoCategory, MongoAuthor, MongoTag } from "@/lib/mongoApi";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Save,
  Send,
  Pin,
  Star,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import SocialEmbedsEditor, { SocialEmbed } from "@/components/admin/SocialEmbedsEditor";

type View = "list" | "create";

const SECTION_CLASSES = "bg-card border border-border rounded-xl p-6 space-y-4";
const LABEL_CLASSES = "block text-sm font-semibold text-foreground mb-1.5";
const INPUT_CLASSES =
  "w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background";

const Section = ({ title, children, collapsible = false }: { title: string; children: React.ReactNode; collapsible?: boolean }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className={SECTION_CLASSES}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-heading font-bold text-foreground">{title}</h3>
        {collapsible && (
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-muted-foreground hover:text-foreground">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
      {open && <div className="space-y-4">{children}</div>}
    </div>
  );
};

const Toggle = ({ checked, onChange, label, icon: Icon, colorClass = "bg-primary" }: { checked: boolean; onChange: (v: boolean) => void; label: string; icon: React.ElementType; colorClass?: string }) => (
  <label className="flex items-center justify-between gap-3 cursor-pointer py-2">
    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn("relative w-10 h-6 rounded-full transition-colors", checked ? colorClass : "bg-muted")}
    >
      <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform", checked ? "translate-x-5" : "translate-x-1")} />
    </button>
  </label>
);

const generateSlugLocal = (text: string) =>
  text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").substring(0, 80);

const AdminSchedulePage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");

  // ─── Form state ─────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [primaryCategoryId, setPrimaryCategoryId] = useState("");
  const [additionalCategories, setAdditionalCategories] = useState<string[]>([]);
  const [socialEmbeds, setSocialEmbeds] = useState<SocialEmbed[]>([]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MongoArticle | null>(null);
  const [publishTarget, setPublishTarget] = useState<MongoArticle | null>(null);

  const [categories, setCategories] = useState<MongoCategory[]>([]);
  const [authors, setAuthors] = useState<MongoAuthor[]>([]);
  const [availableTags, setAvailableTags] = useState<MongoTag[]>([]);

  useEffect(() => {
    if (view === "create") {
      mongoApi.getCategories().then(setCategories).catch(console.error);
      mongoApi.getAuthors().then(setAuthors).catch(console.error);
      mongoApi.getTags().then(setAvailableTags).catch(console.error);
    }
  }, [view]);

  // ─── List data ──────────────────────────────────────────────────────
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-scheduled-articles"],
    queryFn: () => mongoApi.getArticles({ status: "scheduled", limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mongoApi.deleteArticle(id),
    onSuccess: () => {
      toast.success("Scheduled article deleted");
      qc.invalidateQueries({ queryKey: ["admin-scheduled-articles"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete"),
  });

  const publishNowMutation = useMutation({
    mutationFn: (id: string) =>
      mongoApi.updateArticle(id, {
        publication_status: "published",
        published_at: new Date().toISOString(),
        scheduled_for: null,
      }),
    onSuccess: () => {
      toast.success("Article published now!");
      qc.invalidateQueries({ queryKey: ["admin-scheduled-articles"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to publish"),
  });

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  // Sort by scheduled date ascending
  const sorted = [...filtered].sort((a, b) => {
    const dateA = a.scheduled_for ? new Date(a.scheduled_for).getTime() : 0;
    const dateB = b.scheduled_for ? new Date(b.scheduled_for).getTime() : 0;
    return dateA - dateB;
  });

  const resetForm = () => {
    setTitle(""); setSlug(""); setExcerpt(""); setBody("");
    setCoverImageUrl(""); setCoverImageAlt(""); setAuthorId("");
    setPrimaryCategoryId(""); setAdditionalCategories([]);
    setSocialEmbeds([]); setMetaTitle(""); setMetaDescription("");
    setIsPinned(false); setIsFeatured(false); setIsBreaking(false);
    setScheduledFor(""); setSelectedTags([]);
  };

  const handleTitleBlur = () => {
    if (title && !slug) setSlug(generateSlugLocal(title));
  };

  const handleSchedule = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!slug.trim()) { toast.error("Slug is required"); return; }
    if (!excerpt.trim()) { toast.error("Excerpt is required"); return; }
    if (!body.trim() || body === "<p></p>") { toast.error("Article body is required"); return; }
    if (!scheduledFor) { toast.error("Please select a date and time to schedule"); return; }

    const schedDate = new Date(scheduledFor);
    if (schedDate <= new Date()) { toast.error("Schedule date must be in the future"); return; }

    setSaving(true);
    try {
      await mongoApi.createArticle({
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        body,
        cover_image_url: coverImageUrl || null,
        cover_image_alt: coverImageAlt || null,
        author_id: authorId || null,
        primary_category_id: primaryCategoryId || null,
        additional_category_ids: additionalCategories,
        is_pinned: isPinned,
        is_featured: isFeatured,
        is_breaking: isBreaking,
        tags: selectedTags,
        meta_title: (metaTitle || title).substring(0, 60),
        meta_description: (metaDescription || excerpt).substring(0, 160),
        publication_status: "scheduled",
        published_at: null,
        scheduled_for: schedDate.toISOString(),
        social_embeds: socialEmbeds.map((e) => ({
          platform: e.platform,
          embed_url: e.embed_url || null,
          embed_code: e.embed_code || null,
        })),
      });
      toast.success("Article scheduled!");
      qc.invalidateQueries({ queryKey: ["admin-scheduled-articles"] });
      setView("list");
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (article: MongoArticle) => {
    deleteMutation.mutate(article.id);
    setDeleteTarget(null);
  };

  const handlePublishNow = (article: MongoArticle) => {
    publishNowMutation.mutate(article.id);
    setPublishTarget(null);
  };

  const getTimeUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return "Publishing soon...";
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `in ${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `in ${hours}h ${mins}m`;
    return `in ${mins}m`;
  };

  // ─── Create view ────────────────────────────────────────────────────
  if (view === "create") {
    return (
      <div className="p-4 sm:p-6 max-w-4xl">
        <button
          onClick={() => { setView("list"); resetForm(); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Schedule
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-foreground">Schedule New Article</h1>
          <p className="text-sm text-muted-foreground mt-1">Create an article that will be automatically published at your chosen date and time.</p>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Schedule Date — prominent at top */}
          <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-base font-heading font-bold text-foreground">Schedule Date & Time *</h3>
            </div>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className={cn(INPUT_CLASSES, "text-base font-semibold max-w-sm")}
              required
            />
            {scheduledFor && (
              <p className="text-sm text-primary font-medium mt-2">
                Will auto-publish: {new Date(scheduledFor).toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            )}
          </div>

          {/* Cover Image */}
          <Section title="Cover Image">
            <ImageUploader imageUrl={coverImageUrl} imageAlt={coverImageAlt} onImageUrlChange={setCoverImageUrl} onImageAltChange={setCoverImageAlt} />
          </Section>

          {/* Article Details */}
          <Section title="Article Details">
            <div>
              <label className={LABEL_CLASSES}>Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} placeholder="Enter article title..." className={INPUT_CLASSES} required />
            </div>
            <div>
              <label className={LABEL_CLASSES}>Slug *</label>
              <div className="flex gap-2">
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="article-slug" className={`${INPUT_CLASSES} font-mono text-xs`} required />
                <button type="button" onClick={() => title && setSlug(generateSlugLocal(title))} disabled={!title} className="px-3 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50">Regenerate</button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">URL: /news/<span className="font-mono text-primary">{slug || "your-slug"}</span></p>
            </div>
            <div>
              <label className={LABEL_CLASSES}>
                Excerpt / Summary * <span className={cn("text-xs font-normal", excerpt.length > 300 ? "text-destructive" : "text-muted-foreground")}>{excerpt.length}/300</span>
              </label>
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value.substring(0, 300))} placeholder="Brief summary of the article..." rows={3} className={INPUT_CLASSES} required />
            </div>
            <div>
              <label className={LABEL_CLASSES}>Article Body *</label>
              <RichTextEditor value={body} onChange={setBody} />
            </div>
          </Section>

          {/* Author & Categories */}
          <Section title="Author & Categories">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>Author</label>
                <select value={authorId} onChange={(e) => setAuthorId(e.target.value)} className={`${INPUT_CLASSES} bg-background`}>
                  <option value="">Select author...</option>
                  {authors.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASSES}>Primary Category</label>
                <select value={primaryCategoryId} onChange={(e) => setPrimaryCategoryId(e.target.value)} className={`${INPUT_CLASSES} bg-background`}>
                  <option value="">Select category...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL_CLASSES}>Additional Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button key={c.id} type="button" onClick={() => setAdditionalCategories((prev) => prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id])}
                    className={cn("px-3 py-1 rounded-full text-sm font-medium border transition-colors", additionalCategories.includes(c.id) ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary hover:text-primary")}
                  >{c.name}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL_CLASSES}>Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((t) => (
                  <button key={t.id} type="button"
                    onClick={() => setSelectedTags((prev) => prev.includes(t.slug) ? prev.filter((s) => s !== t.slug) : [...prev, t.slug])}
                    className={cn("px-3 py-1 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5", selectedTags.includes(t.slug) ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary hover:text-primary")}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color || "#6b7280" }} />
                    {t.name}
                  </button>
                ))}
                {availableTags.length === 0 && <p className="text-xs text-muted-foreground">No tags created yet.</p>}
              </div>
            </div>
          </Section>

          {/* Social Embeds */}
          <Section title="Social Media Embeds" collapsible>
            <SocialEmbedsEditor embeds={socialEmbeds} onChange={setSocialEmbeds} />
          </Section>

          {/* SEO */}
          <Section title="SEO Settings" collapsible>
            <div>
              <label className={LABEL_CLASSES}>Meta Title <span className={cn("text-xs font-normal", metaTitle.length > 60 ? "text-destructive" : "text-muted-foreground")}>{metaTitle.length}/60</span></label>
              <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value.substring(0, 60))} placeholder={title || "Leave blank to use article title"} className={INPUT_CLASSES} />
            </div>
            <div>
              <label className={LABEL_CLASSES}>Meta Description <span className={cn("text-xs font-normal", metaDescription.length > 160 ? "text-destructive" : "text-muted-foreground")}>{metaDescription.length}/160</span></label>
              <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value.substring(0, 160))} placeholder={excerpt || "Leave blank to use excerpt"} rows={3} className={INPUT_CLASSES} />
            </div>
          </Section>

          {/* Publishing Options */}
          <Section title="Publishing Options">
            <div className="divide-y divide-border">
              <Toggle checked={isPinned} onChange={setIsPinned} label="Pin Article" icon={Pin} />
              <Toggle checked={isFeatured} onChange={setIsFeatured} label="Featured Story" icon={Star} colorClass="bg-secondary" />
              <Toggle checked={isBreaking} onChange={setIsBreaking} label="Breaking News" icon={Zap} colorClass="bg-destructive" />
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
              <button type="button" onClick={handleSchedule} disabled={saving || !scheduledFor}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                Schedule Article
              </button>
              <button type="button" onClick={() => { setView("list"); resetForm(); }}
                className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </Section>
        </form>
      </div>
    );
  }

  // ─── List view ──────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Scheduled Posts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Articles that will be automatically published at their scheduled time
          </p>
        </div>
        <Button onClick={() => setView("create")} className="gap-2">
          <PlusCircle className="h-4 w-4" /> Schedule New Article
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-center gap-1.5 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{articles.length}</span>
          <span className="text-muted-foreground">Scheduled</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search scheduled posts..." className="pl-9" />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5 bg-card animate-pulse h-28" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm mb-2">No scheduled articles.</p>
          <button onClick={() => setView("create")} className="text-primary hover:underline text-sm">
            Schedule your first article →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((article) => {
            const isPast = article.scheduled_for ? new Date(article.scheduled_for).getTime() <= Date.now() : false;
            return (
              <div
                key={article.id}
                className={cn(
                  "border rounded-xl p-5 bg-card transition-colors",
                  isPast ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/30"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold text-base text-foreground leading-snug">
                        {article.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        <Clock className="h-3 w-3" />
                        SCHEDULED
                      </span>
                      {isPast && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground animate-pulse">
                          Publishing soon...
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-body mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {article.scheduled_for
                          ? new Date(article.scheduled_for).toLocaleString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                      {article.scheduled_for && !isPast && (
                        <span className="text-primary font-semibold">
                          {getTimeUntil(article.scheduled_for)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.view_count} views
                      </span>
                    </div>

                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground font-body line-clamp-1 mt-1.5">
                        {article.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPublishTarget(article)}
                      disabled={publishNowMutation.isPending}
                      className="gap-1.5 text-xs"
                    >
                      <Send className="h-3.5 w-3.5" /> Publish Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/articles/edit/${article.id}`)}
                      className="gap-1.5 text-xs"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <button
                      onClick={() => setDeleteTarget(article)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scheduled article?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}". This action cannot be undone.
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

      {/* Publish Now Confirmation */}
      <AlertDialog open={!!publishTarget} onOpenChange={(open) => { if (!open) setPublishTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish immediately?</AlertDialogTitle>
            <AlertDialogDescription>
              This will publish "{publishTarget?.title}" right now instead of at the scheduled time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => publishTarget && handlePublishNow(publishTarget)}>
              Publish Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSchedulePage;
