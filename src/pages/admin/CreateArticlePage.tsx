import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import SocialEmbedsEditor, { SocialEmbed } from "@/components/admin/SocialEmbedsEditor";
import { Save, Send, Clock, Pin, Star, Zap, Loader2, ChevronDown, ChevronUp, History, Sparkles, Lightbulb } from "lucide-react";
import SeoCharCount from "@/components/admin/SeoCharCount";
import { cn } from "@/lib/utils";
import { mongoApi, MongoCategory, MongoAuthor, MongoTag } from "@/lib/mongoApi";

const SECTION_CLASSES = "bg-card border border-border/60 rounded-2xl p-6 space-y-5";
const LABEL_CLASSES = "block text-[13px] font-semibold text-foreground mb-2 font-body";
const INPUT_CLASSES =
  "w-full border border-border/60 rounded-xl px-4 py-2.5 text-[13px] font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 bg-muted/20 hover:bg-muted/30 transition-colors";

const Section = ({
  title,
  children,
  collapsible = false,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <div className={SECTION_CLASSES}>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-heading font-bold text-foreground">{title}</h3>
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-muted-foreground hover:text-foreground"
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
      {open && <div className="space-y-5">{children}</div>}
    </div>
  );
};

const Toggle = ({
  checked,
  onChange,
  label,
  icon: Icon,
  colorClass = "bg-primary",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon: React.ElementType;
  colorClass?: string;
}) => (
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
      className={cn(
        "relative w-11 h-6 rounded-full transition-all duration-300",
        checked ? colorClass : "bg-muted/60"
      )}
    >
      <span
        className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  </label>
);

const generateSlugLocal = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);

const CreateArticlePage = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [categories, setCategories] = useState<MongoCategory[]>([]);
  const [authors, setAuthors] = useState<MongoAuthor[]>([]);
  const [availableTags, setAvailableTags] = useState<MongoTag[]>([]);

  // Form state
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
  const [isPinned, setIsPinned] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [backdateAt, setBackdateAt] = useState("");
  const [backdating, setBackdating] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [generatingExcerpt, setGeneratingExcerpt] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleGenerateTitle = async () => {
    if (!body.trim() && !excerpt.trim()) {
      toast.error("Add article body or excerpt first");
      return;
    }
    setGeneratingTitle(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-seo", {
        body: { title: "", excerpt: excerpt.trim(), body },
      });
      if (error) throw error;
      if (data?.meta_title) setTitle(data.meta_title.substring(0, 60));
      toast.success("Title generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate title");
    } finally {
      setGeneratingTitle(false);
    }
  };

  const handleSuggestTitles = async () => {
    if (!body.trim() && !excerpt.trim()) {
      toast.error("Add article body or excerpt first");
      return;
    }
    setLoadingSuggestions(true);
    setTitleSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-titles", {
        body: { body, excerpt: excerpt.trim() },
      });
      if (error) throw error;
      const suggestions = (data?.suggestions || []).map((s: any) => s.title?.substring(0, 60)).filter(Boolean);
      setTitleSuggestions(suggestions);
      if (!suggestions.length) toast.error("No suggestions returned");
    } catch (err: any) {
      toast.error(err.message || "Failed to get suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleGenerateExcerpt = async () => {
    if (!title.trim() && !body.trim()) {
      toast.error("Add a title or body first");
      return;
    }
    setGeneratingExcerpt(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-excerpt", {
        body: { title: title.trim(), body },
      });
      if (error) throw error;
      if (data?.excerpt) setExcerpt(data.excerpt.substring(0, 160));
      toast.success("Excerpt generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate excerpt");
    } finally {
      setGeneratingExcerpt(false);
    }
  };

  useEffect(() => {
    mongoApi.getCategories().then(setCategories).catch(console.error);
    mongoApi.getAuthors().then(setAuthors).catch(console.error);
    mongoApi.getTags().then(setAvailableTags).catch(console.error);
  }, []);

  const handleTitleBlur = () => {
    if (title && !slug) setSlug(generateSlugLocal(title));
  };

  const saveArticle = async (
    status: "draft" | "published" | "scheduled" = "draft",
    scheduledAt?: string,
    customPublishedAt?: string
  ): Promise<string | null> => {
    if (!title.trim()) { toast.error("Title is required"); return null; }
    if (title.trim().length < 30) { toast.error("Title must be at least 30 characters"); return null; }
    if (title.trim().length > 60) { toast.error("Title must be at most 60 characters"); return null; }
    if (!slug.trim()) { toast.error("Slug is required"); return null; }
    if (!excerpt.trim()) { toast.error("Excerpt is required"); return null; }
    if (excerpt.trim().length < 120) { toast.error("Excerpt must be at least 120 characters"); return null; }
    if (!body.trim() || body === "<p></p>") { toast.error("Article body is required"); return null; }

    const payload = {
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
      meta_title: title.trim().substring(0, 60),
      meta_description: excerpt.trim().substring(0, 160),
      publication_status: status,
      published_at: customPublishedAt || (status === "published" ? new Date().toISOString() : null),
      scheduled_for: scheduledAt || null,
      social_embeds: socialEmbeds.map((e) => ({
        platform: e.platform,
        embed_url: e.embed_url || null,
        embed_code: e.embed_code || null,
      })),
    };

    const { id } = await mongoApi.createArticle(payload);
    return id;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const id = await saveArticle("draft");
      if (id) {
        toast.success("Article saved as draft");
        navigate("/admin/articles");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const id = await saveArticle("published");
      if (id) {
        toast.success("Article published successfully!");
        navigate("/admin/articles");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleBackdatePublish = async () => {
    if (!backdateAt) { toast.error("Please select a backdate"); return; }
    const bd = new Date(backdateAt);
    if (bd >= new Date()) { toast.error("Backdate must be in the past"); return; }
    setBackdating(true);
    try {
      const id = await saveArticle("published", undefined, bd.toISOString());
      if (id) {
        toast.success("Article published with backdate!");
        navigate("/admin/articles");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    } finally {
      setBackdating(false);
    }
  };


  const handleSchedule = async () => {
    if (!scheduledFor) { toast.error("Please select a date and time to schedule"); return; }
    setScheduling(true);
    try {
      const id = await saveArticle("scheduled", scheduledFor);
      if (id) {
        toast.success("Article scheduled!");
        navigate("/admin/articles");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule");
    } finally {
      setScheduling(false);
    }
  };

  const toggleAdditionalCategory = (id: string) => {
    setAdditionalCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-5 sm:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-heading font-bold text-foreground tracking-tight">Create Article</h1>
        <p className="text-[13px] text-muted-foreground/70 mt-1 font-body">Fill in all details below. Fields marked * are required.</p>
      </div>

      <form className="space-y-7" onSubmit={(e) => e.preventDefault()}>
        {/* Cover Image */}
        <Section title="Cover Image">
          <ImageUploader
            imageUrl={coverImageUrl}
            imageAlt={coverImageAlt}
            onImageUrlChange={setCoverImageUrl}
            onImageAltChange={setCoverImageAlt}
          />
        </Section>

        {/* Article Details */}
        <Section title="Article Details">
          <div>
            <label className={LABEL_CLASSES}>
              Title & Meta Title *{" "}
              <SeoCharCount value={title} max={60} idealMin={30} idealMax={60} />
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.substring(0, 60))}
              onBlur={handleTitleBlur}
              placeholder="Enter article title (also used as SEO meta title)..."
              className={INPUT_CLASSES}
              required
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-muted-foreground">Used as both the article headline and Google search title</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSuggestTitles}
                  disabled={loadingSuggestions}
                  className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingSuggestions ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
                  {loadingSuggestions ? "Loading…" : "Suggest titles"}
                </button>
                <button
                  type="button"
                  onClick={handleGenerateTitle}
                  disabled={generatingTitle}
                  className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-secondary hover:bg-secondary/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {generatingTitle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {generatingTitle ? "Generating…" : "Auto-generate"}
                </button>
              </div>
            </div>
            {titleSuggestions.length > 0 && (
              <div className="mt-2 border border-border/60 rounded-xl p-3 bg-muted/10 space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">Click to use a suggestion:</p>
                {titleSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setTitle(s); setTitleSuggestions([]); toast.success("Title applied!"); }}
                    className="w-full text-left px-3 py-2 text-[13px] rounded-lg hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={LABEL_CLASSES}>Slug *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="article-slug"
                className={`${INPUT_CLASSES} font-mono text-xs`}
                required
              />
              <button
                type="button"
                onClick={() => title && setSlug(generateSlugLocal(title))}
                disabled={!title}
                className="px-3 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                Regenerate
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              URL: /news/<span className="font-mono text-primary">{slug || "your-slug"}</span>
            </p>
          </div>

          <div>
            <label className={LABEL_CLASSES}>
              Excerpt & Meta Description *{" "}
              <SeoCharCount value={excerpt} max={160} idealMin={120} idealMax={160} />
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value.substring(0, 160))}
              placeholder="Brief summary (also used as SEO meta description)..."
              rows={3}
              className={INPUT_CLASSES}
              required
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-muted-foreground">Used as both the article summary and Google search description</p>
              <button
                type="button"
                onClick={handleGenerateExcerpt}
                disabled={generatingExcerpt}
                className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-secondary hover:bg-secondary/10 rounded-lg transition-colors disabled:opacity-50"
              >
                {generatingExcerpt ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {generatingExcerpt ? "Generating…" : "Auto-generate"}
              </button>
            </div>
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
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className={`${INPUT_CLASSES} bg-background`}
              >
                <option value="">Select author...</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASSES}>Primary Category</label>
              <select
                value={primaryCategoryId}
                onChange={(e) => setPrimaryCategoryId(e.target.value)}
                className={`${INPUT_CLASSES} bg-background`}
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASSES}>Additional Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleAdditionalCategory(c.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border transition-colors",
                    additionalCategories.includes(c.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={LABEL_CLASSES}>Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setSelectedTags((prev) =>
                      prev.includes(t.slug) ? prev.filter((s) => s !== t.slug) : [...prev, t.slug]
                    )
                  }
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5",
                    selectedTags.includes(t.slug)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color || "#6b7280" }} />
                  {t.name}
                </button>
              ))}
              {availableTags.length === 0 && (
                <p className="text-xs text-muted-foreground">No tags created yet. Go to Tags in the sidebar to create some.</p>
              )}
            </div>
          </div>
        </Section>

        {/* Social Embeds */}
        <Section title="Social Media Embeds" collapsible>
          <SocialEmbedsEditor embeds={socialEmbeds} onChange={setSocialEmbeds} />
        </Section>

        {/* Publishing Options */}
        <Section title="Publishing Options">
          <div className="divide-y divide-border">
            <Toggle checked={isPinned} onChange={setIsPinned} label="Pin Article" icon={Pin} />
            <Toggle checked={isFeatured} onChange={setIsFeatured} label="Featured Story" icon={Star} />
            <Toggle checked={isBreaking} onChange={setIsBreaking} label="Breaking News" icon={Zap} colorClass="bg-destructive" />
          </div>

          <div>
            <label className={LABEL_CLASSES}>Schedule for Later</label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className={INPUT_CLASSES}
            />
          </div>

          {/* Backdate Publishing */}
          <div className="border border-border/60 rounded-xl p-4 bg-muted/10">
            <label className={LABEL_CLASSES}>
              <span className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                Backdate Publish
              </span>
            </label>
            <p className="text-[11px] text-muted-foreground/60 mb-2 font-body">Publish with a past date so the article appears as if it was posted earlier.</p>
            <input
              type="datetime-local"
              value={backdateAt}
              onChange={(e) => setBackdateAt(e.target.value)}
              max={new Date().toISOString().slice(0, 16)}
              className={INPUT_CLASSES}
            />
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 border border-border/60 rounded-xl text-[13px] font-semibold font-body hover:bg-muted/50 transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save as Draft
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-[13px] font-semibold font-body hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish Now
            </button>

            <button
              type="button"
              onClick={handleSchedule}
              disabled={scheduling || !scheduledFor}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-[13px] font-semibold font-body hover:bg-secondary/90 transition-all disabled:opacity-60"
            >
              {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              Schedule
            </button>

            <button
              type="button"
              onClick={handleBackdatePublish}
              disabled={backdating || !backdateAt}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-xl text-[13px] font-semibold font-body hover:bg-accent/90 transition-all disabled:opacity-60"
            >
              {backdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
              Publish (Backdated)
            </button>
          </div>
        </Section>
      </form>
    </div>
  );
};

export default CreateArticlePage;
