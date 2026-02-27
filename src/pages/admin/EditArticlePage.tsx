import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import SocialEmbedsEditor, { SocialEmbed } from "@/components/admin/SocialEmbedsEditor";
import { Save, Send, Clock, Pin, Star, Zap, Loader2, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { mongoApi, MongoCategory, MongoAuthor } from "@/lib/mongoApi";

const SECTION_CLASSES = "bg-card border border-border rounded-xl p-6 space-y-4";
const LABEL_CLASSES = "block text-sm font-semibold text-foreground mb-1.5";
const INPUT_CLASSES =
  "w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background";

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
        <h3 className="text-base font-heading font-bold text-foreground">{title}</h3>
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
      {open && <div className="space-y-4">{children}</div>}
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
        "relative w-10 h-6 rounded-full transition-colors",
        checked ? colorClass : "bg-muted"
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
  text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").substring(0, 80);

const EditArticlePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [categories, setCategories] = useState<MongoCategory[]>([]);
  const [authors, setAuthors] = useState<MongoAuthor[]>([]);

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
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      mongoApi.getArticleById(id),
      mongoApi.getCategories(),
      mongoApi.getAuthors(),
    ])
      .then(([article, cats, auths]) => {
        setCategories(cats);
        setAuthors(auths);
        setTitle(article.title || "");
        setSlug(article.slug || "");
        setExcerpt(article.excerpt || "");
        setBody(article.body || "");
        setCoverImageUrl(article.cover_image_url || "");
        setCoverImageAlt(article.cover_image_alt || "");
        setAuthorId(article.author_id || "");
        setPrimaryCategoryId(article.primary_category_id || "");
        setAdditionalCategories((article as any).additional_category_ids || []);
        setSocialEmbeds((article.social_embeds || []) as SocialEmbed[]);
        setMetaTitle(article.meta_title || "");
        setMetaDescription(article.meta_description || "");
        setIsPinned(article.is_pinned);
        setIsFeatured(article.is_featured);
        setIsBreaking(article.is_breaking);
        setScheduledFor(article.scheduled_for ? article.scheduled_for.slice(0, 16) : "");
      })
      .catch((err) => {
        toast.error("Failed to load article");
        console.error(err);
      })
      .finally(() => setLoadingArticle(false));
  }, [id]);

  const buildPayload = (status: "draft" | "published" | "scheduled", scheduledAt?: string) => ({
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
    meta_title: (metaTitle || title).substring(0, 60),
    meta_description: (metaDescription || excerpt).substring(0, 160),
    publication_status: status,
    published_at: status === "published" ? new Date().toISOString() : null,
    scheduled_for: scheduledAt || null,
    social_embeds: socialEmbeds.map((e) => ({
      platform: e.platform,
      embed_url: e.embed_url || null,
      embed_code: e.embed_code || null,
    })),
  });

  const validate = () => {
    if (!title.trim()) { toast.error("Title is required"); return false; }
    if (!slug.trim()) { toast.error("Slug is required"); return false; }
    if (!excerpt.trim()) { toast.error("Excerpt is required"); return false; }
    if (!body.trim() || body === "<p></p>") { toast.error("Article body is required"); return false; }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validate() || !id) return;
    setSaving(true);
    try {
      await mongoApi.updateArticle(id, buildPayload("draft"));
      toast.success("Article saved as draft");
      navigate("/admin/articles");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handlePublish = async () => {
    if (!validate() || !id) return;
    setPublishing(true);
    try {
      await mongoApi.updateArticle(id, buildPayload("published"));
      toast.success("Article updated and published!");
      navigate("/admin/articles");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    } finally { setPublishing(false); }
  };

  const handleSchedule = async () => {
    if (!scheduledFor) { toast.error("Please select a date and time to schedule"); return; }
    if (!validate() || !id) return;
    setScheduling(true);
    try {
      await mongoApi.updateArticle(id, buildPayload("scheduled", scheduledFor));
      toast.success("Article scheduled!");
      navigate("/admin/articles");
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule");
    } finally { setScheduling(false); }
  };

  const toggleAdditionalCategory = (catId: string) => {
    setAdditionalCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  if (loadingArticle) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin/articles")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Articles
        </button>
        <h1 className="text-2xl font-heading font-bold text-foreground">Edit Article</h1>
        <p className="text-sm text-muted-foreground mt-1">Update all details below. Fields marked * are required.</p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
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
            <label className={LABEL_CLASSES}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title..."
              className={INPUT_CLASSES}
            />
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
              Excerpt / Summary *{" "}
              <span className={cn("text-xs font-normal", excerpt.length > 300 ? "text-destructive" : "text-muted-foreground")}>
                {excerpt.length}/300
              </span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value.substring(0, 300))}
              placeholder="Brief summary of the article..."
              rows={3}
              className={INPUT_CLASSES}
            />
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
                  <option key={a.id} value={a.id}>{a.full_name}</option>
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
        </Section>

        {/* Social Embeds */}
        <Section title="Social Media Embeds" collapsible>
          <SocialEmbedsEditor embeds={socialEmbeds} onChange={setSocialEmbeds} />
        </Section>

        {/* SEO */}
        <Section title="SEO Settings" collapsible>
          <div>
            <label className={LABEL_CLASSES}>
              Meta Title{" "}
              <span className={cn("text-xs font-normal", metaTitle.length > 60 ? "text-destructive" : "text-muted-foreground")}>
                {metaTitle.length}/60
              </span>
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value.substring(0, 60))}
              placeholder={title || "Leave blank to use article title"}
              className={INPUT_CLASSES}
            />
          </div>
          <div>
            <label className={LABEL_CLASSES}>
              Meta Description{" "}
              <span className={cn("text-xs font-normal", metaDescription.length > 160 ? "text-destructive" : "text-muted-foreground")}>
                {metaDescription.length}/160
              </span>
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value.substring(0, 160))}
              placeholder={excerpt || "Leave blank to use excerpt"}
              rows={3}
              className={INPUT_CLASSES}
            />
          </div>
        </Section>

        {/* Publishing Options */}
        <Section title="Publishing Options">
          <div className="divide-y divide-border">
            <Toggle checked={isPinned} onChange={setIsPinned} label="Pin Article" icon={Pin} />
            <Toggle checked={isFeatured} onChange={setIsFeatured} label="Featured Story" icon={Star} colorClass="bg-secondary" />
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

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save as Draft
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Update & Publish
            </button>

            <button
              type="button"
              onClick={handleSchedule}
              disabled={scheduling || !scheduledFor}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-60"
            >
              {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              Schedule
            </button>
          </div>
        </Section>
      </form>
    </div>
  );
};

export default EditArticlePage;
