import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import SocialEmbedsEditor, { SocialEmbed } from "@/components/admin/SocialEmbedsEditor";
import { Save, Send, Clock, Pin, Star, Zap, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Author {
  id: string;
  full_name: string;
  role: string;
}

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

const CreateArticlePage = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [slugGenerating, setSlugGenerating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

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

  // Load categories, authors, and current user
  useEffect(() => {
    const load = async () => {
      const { data: cats } = await supabase.from("categories").select("*").order("name");
      if (cats) setCategories(cats);

      const { data: auths } = await supabase.from("authors").select("*").order("full_name");
      if (auths) setAuthors(auths);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        setCurrentUserRole(roleRow?.role || null);

        // Pre-select this user's author record
        const { data: authorRow } = await supabase
          .from("authors")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (authorRow) setAuthorId(authorRow.id);
      }
    };
    load();
  }, []);

  const generateSlug = useCallback(async (titleValue: string) => {
    if (!titleValue.trim()) return;
    setSlugGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-slug", {
        body: { title: titleValue },
      });
      if (error) throw error;
      setSlug(data.slug);
    } catch {
      // Fallback client-side
      setSlug(
        titleValue
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 80)
      );
    } finally {
      setSlugGenerating(false);
    }
  }, []);

  const handleTitleBlur = () => {
    if (title && !slug) generateSlug(title);
  };

  const saveArticle = async (): Promise<string | null> => {
    if (!title.trim()) { toast.error("Title is required"); return null; }
    if (!slug.trim()) { toast.error("Slug is required"); return null; }
    if (!excerpt.trim()) { toast.error("Excerpt is required"); return null; }
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
      is_pinned: isPinned,
      is_featured: isFeatured,
      is_breaking: isBreaking,
      meta_title: (metaTitle || title).substring(0, 60),
      meta_description: (metaDescription || excerpt).substring(0, 160),
    };

    const { data: { user } } = await supabase.auth.getUser();
    const { data: article, error } = await supabase
      .from("articles")
      .insert({ ...payload, created_by: user?.id })
      .select()
      .single();

    if (error) throw error;

    // Save additional categories
    if (additionalCategories.length > 0) {
      await supabase.from("article_categories").insert(
        additionalCategories.map((cat_id) => ({
          article_id: article.id,
          category_id: cat_id,
        }))
      );
    }

    // Save social embeds
    if (socialEmbeds.length > 0) {
      await supabase.from("social_embeds").insert(
        socialEmbeds.map((e) => ({
          article_id: article.id,
          platform: e.platform as "facebook" | "instagram" | "spotify" | "tiktok" | "twitter" | "youtube",
          embed_url: e.embed_url || null,
          embed_code: e.embed_code || null,
        }))
      );
    }

    return article.id;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const id = await saveArticle();
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
    if (currentUserRole === "reporter") {
      toast.error("Reporters can only save drafts");
      return;
    }
    setPublishing(true);
    try {
      const id = await saveArticle();
      if (!id) return;

      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("publish-article", {
        body: { article_id: id },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success("Article published successfully!");
      navigate("/admin/articles");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledFor) { toast.error("Please select a date and time to schedule"); return; }
    if (currentUserRole === "reporter") { toast.error("Reporters cannot schedule articles"); return; }
    setScheduling(true);
    try {
      const id = await saveArticle();
      if (!id) return;

      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("schedule-article", {
        body: { article_id: id, scheduled_for: scheduledFor },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success("Article scheduled!");
      navigate("/admin/articles");
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

  const canPublish = currentUserRole === "admin" || currentUserRole === "editor";

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Create Article</h1>
        <p className="text-sm text-muted-foreground mt-1">Fill in all details below. Fields marked * are required.</p>
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
              onBlur={handleTitleBlur}
              placeholder="Enter article title..."
              className={INPUT_CLASSES}
              required
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>
              Slug *{" "}
              {slugGenerating && (
                <span className="text-xs text-muted-foreground font-normal">generating...</span>
              )}
            </label>
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
                onClick={() => generateSlug(title)}
                disabled={!title || slugGenerating}
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
              required
            />
          </div>

          <div>
            <label className={LABEL_CLASSES}>Article Body *</label>
            <RichTextEditor value={body} onChange={setBody} />
          </div>
        </Section>

        {/* Author & Categories */}
        <Section title="Author & Categories">
          <div className="grid grid-cols-2 gap-4">
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
                    {a.full_name} ({a.role})
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
          <p className="text-xs text-muted-foreground">
            If left blank, meta title defaults to article title and meta description defaults to excerpt.
          </p>
        </Section>

        {/* Publishing Options */}
        <Section title="Publishing Options">
          <div className="divide-y divide-border">
            <Toggle checked={isPinned} onChange={setIsPinned} label="Pin Article" icon={Pin} />
            <Toggle checked={isFeatured} onChange={setIsFeatured} label="Featured Story" icon={Star} colorClass="bg-secondary" />
            <Toggle checked={isBreaking} onChange={setIsBreaking} label="Breaking News" icon={Zap} colorClass="bg-destructive" />
          </div>

          {/* Schedule picker */}
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

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save as Draft
            </button>

            {canPublish && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish Now
              </button>
            )}

            {canPublish && (
              <button
                type="button"
                onClick={handleSchedule}
                disabled={scheduling || !scheduledFor}
                className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-60"
              >
                {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                Schedule
              </button>
            )}
          </div>

          {currentUserRole === "reporter" && (
            <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
              ℹ️ As a reporter, you can save drafts only. An admin or editor will publish your article.
            </p>
          )}
        </Section>
      </form>
    </div>
  );
};

export default CreateArticlePage;
