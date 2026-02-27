import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mongoApi, SiteSettings } from "@/lib/mongoApi";
import { toast } from "sonner";
import { Settings, Palette, Globe, Share2, Search as SearchIcon, Save, Loader2, Monitor, Type, Mail, MapPin, Phone, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SECTION_CLASSES = "bg-card border border-border rounded-xl p-6 space-y-4";
const LABEL_CLASSES = "block text-sm font-semibold text-foreground mb-1.5";
const INPUT_CLASSES =
  "w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background";

const HEADING_FONTS = [
  "Playfair Display",
  "IBM Plex Serif",
  "Merriweather",
  "Lora",
  "Georgia",
  "Roboto Slab",
];

const BODY_FONTS = [
  "Source Sans 3",
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Noto Sans",
];

const AdminSettingsPage = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => mongoApi.getSettings(),
  });

  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [initialized, setInitialized] = useState(false);

  // Initialize form from fetched settings
  if (settings && !initialized) {
    setForm(settings);
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => mongoApi.updateSettings(form),
    onSuccess: () => {
      toast.success("Settings saved successfully");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to save settings"),
  });

  const updateField = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5" /> Site Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your news site appearance and behavior</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex flex-wrap">
          <TabsTrigger value="general" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" /> General
          </TabsTrigger>
          <TabsTrigger value="theme" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" /> Theme
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" /> Social
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5">
            <SearchIcon className="h-3.5 w-3.5" /> SEO
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-1.5">
            <Monitor className="h-3.5 w-3.5" /> Advanced
          </TabsTrigger>
        </TabsList>

        {/* ── General ──────────────────────────────────────────────── */}
        <TabsContent value="general" className="space-y-6">
          <div className={SECTION_CLASSES}>
            <h3 className="text-base font-heading font-bold text-foreground">Site Identity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>Site Name</label>
                <Input
                  value={form.site_name || ""}
                  onChange={(e) => updateField("site_name", e.target.value)}
                  placeholder="Dominica News"
                />
              </div>
              <div>
                <label className={LABEL_CLASSES}>Tagline</label>
                <Input
                  value={form.site_tagline || ""}
                  onChange={(e) => updateField("site_tagline", e.target.value)}
                  placeholder="Your Trusted Caribbean News Source"
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASSES}>Site Description</label>
              <Textarea
                value={form.site_description || ""}
                onChange={(e) => updateField("site_description", e.target.value)}
                placeholder="Brief description of your site..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <div className={SECTION_CLASSES}>
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" /> Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>Email</label>
                <Input
                  type="email"
                  value={form.contact_email || ""}
                  onChange={(e) => updateField("contact_email", e.target.value)}
                  placeholder="info@dominicanews.dm"
                />
              </div>
              <div>
                <label className={LABEL_CLASSES}>Phone</label>
                <Input
                  value={form.contact_phone || ""}
                  onChange={(e) => updateField("contact_phone", e.target.value)}
                  placeholder="+1 (767) 123-4567"
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASSES}>Address</label>
              <Input
                value={form.contact_address || ""}
                onChange={(e) => updateField("contact_address", e.target.value)}
                placeholder="Roseau, Dominica"
              />
            </div>
          </div>

          <div className={SECTION_CLASSES}>
            <h3 className="text-base font-heading font-bold text-foreground">Branding</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>Logo URL</label>
                <Input
                  value={form.logo_url || ""}
                  onChange={(e) => updateField("logo_url", e.target.value)}
                  placeholder="https://..."
                />
                {form.logo_url && (
                  <img src={form.logo_url} alt="Logo preview" className="mt-2 h-10 object-contain rounded" />
                )}
              </div>
              <div>
                <label className={LABEL_CLASSES}>Favicon URL</label>
                <Input
                  value={form.favicon_url || ""}
                  onChange={(e) => updateField("favicon_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Theme ────────────────────────────────────────────────── */}
        <TabsContent value="theme" className="space-y-6">
          <div className={SECTION_CLASSES}>
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <Palette className="h-4 w-4" /> Colors
            </h3>
            <p className="text-xs text-muted-foreground">Customize your site's color palette.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={LABEL_CLASSES}>Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color || "#1a7a3a"}
                    onChange={(e) => updateField("primary_color", e.target.value)}
                    className="w-10 h-10 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={form.primary_color || ""}
                    onChange={(e) => updateField("primary_color", e.target.value)}
                    placeholder="#1a7a3a"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASSES}>Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.secondary_color || "#2563ba"}
                    onChange={(e) => updateField("secondary_color", e.target.value)}
                    className="w-10 h-10 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={form.secondary_color || ""}
                    onChange={(e) => updateField("secondary_color", e.target.value)}
                    placeholder="#2563ba"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASSES}>Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accent_color || "#dc2626"}
                    onChange={(e) => updateField("accent_color", e.target.value)}
                    className="w-10 h-10 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={form.accent_color || ""}
                    onChange={(e) => updateField("accent_color", e.target.value)}
                    placeholder="#dc2626"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Preview</p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-20 rounded" style={{ backgroundColor: form.primary_color || "#1a7a3a" }} />
                <div className="h-8 w-20 rounded" style={{ backgroundColor: form.secondary_color || "#2563ba" }} />
                <div className="h-8 w-20 rounded" style={{ backgroundColor: form.accent_color || "#dc2626" }} />
              </div>
            </div>
          </div>

          <div className={SECTION_CLASSES}>
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <Type className="h-4 w-4" /> Typography
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>Heading Font</label>
                <select
                  value={form.font_heading || "Playfair Display"}
                  onChange={(e) => updateField("font_heading", e.target.value)}
                  className={`${INPUT_CLASSES} bg-background`}
                >
                  {HEADING_FONTS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <p className="text-lg mt-2" style={{ fontFamily: form.font_heading || "Playfair Display" }}>
                  The quick brown fox
                </p>
              </div>
              <div>
                <label className={LABEL_CLASSES}>Body Font</label>
                <select
                  value={form.font_body || "Source Sans 3"}
                  onChange={(e) => updateField("font_body", e.target.value)}
                  className={`${INPUT_CLASSES} bg-background`}
                >
                  {BODY_FONTS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <p className="text-sm mt-2" style={{ fontFamily: form.font_body || "Source Sans 3" }}>
                  The quick brown fox jumps over the lazy dog.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Social ───────────────────────────────────────────────── */}
        <TabsContent value="social" className="space-y-6">
          <div className={SECTION_CLASSES}>
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <Share2 className="h-4 w-4" /> Social Media Links
            </h3>
            <p className="text-xs text-muted-foreground">These links appear in the footer and other social sections.</p>
            <div className="space-y-3">
              {([
                { key: "social_facebook" as const, label: "Facebook", placeholder: "https://facebook.com/..." },
                { key: "social_twitter" as const, label: "Twitter / X", placeholder: "https://twitter.com/..." },
                { key: "social_instagram" as const, label: "Instagram", placeholder: "https://instagram.com/..." },
                { key: "social_youtube" as const, label: "YouTube", placeholder: "https://youtube.com/..." },
              ]).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={LABEL_CLASSES}>{label}</label>
                  <Input
                    value={(form[key] as string) || ""}
                    onChange={(e) => updateField(key, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── SEO ──────────────────────────────────────────────────── */}
        <TabsContent value="seo" className="space-y-6">
          <div className={SECTION_CLASSES}>
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <SearchIcon className="h-4 w-4" /> SEO Defaults
            </h3>
            <p className="text-xs text-muted-foreground">Default meta tags used across the site when not overridden by individual pages.</p>
            <div>
              <label className={LABEL_CLASSES}>Default Meta Title</label>
              <Input
                value={form.meta_title || ""}
                onChange={(e) => updateField("meta_title", e.target.value)}
                placeholder="Dominica News - Breaking News & Caribbean Coverage"
              />
              <p className="text-xs text-muted-foreground mt-1">{(form.meta_title || "").length}/60 characters</p>
            </div>
            <div>
              <label className={LABEL_CLASSES}>Default Meta Description</label>
              <Textarea
                value={form.meta_description || ""}
                onChange={(e) => updateField("meta_description", e.target.value)}
                placeholder="Your trusted source for..."
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground mt-1">{(form.meta_description || "").length}/160 characters</p>
            </div>
            <div>
              <label className={LABEL_CLASSES}>Google Analytics ID</label>
              <Input
                value={form.google_analytics_id || ""}
                onChange={(e) => updateField("google_analytics_id", e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="font-mono text-xs"
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Advanced ─────────────────────────────────────────────── */}
        <TabsContent value="advanced" className="space-y-6">
          <div className={SECTION_CLASSES}>
            <h3 className="text-base font-heading font-bold text-foreground flex items-center gap-2">
              <Monitor className="h-4 w-4" /> Display Settings
            </h3>
            <div>
              <label className={LABEL_CLASSES}>Articles Per Page</label>
              <Input
                type="number"
                value={form.articles_per_page || 20}
                onChange={(e) => updateField("articles_per_page", parseInt(e.target.value) || 20)}
                min={5}
                max={100}
              />
            </div>
            <div className="space-y-3 divide-y divide-border">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Show Breaking News Ticker</p>
                  <p className="text-xs text-muted-foreground">Display the breaking news section on the homepage</p>
                </div>
                <Switch
                  checked={form.show_breaking_ticker !== false}
                  onCheckedChange={(v) => updateField("show_breaking_ticker", v)}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Show Featured Section</p>
                  <p className="text-xs text-muted-foreground">Display featured articles prominently on the homepage</p>
                </div>
                <Switch
                  checked={form.show_featured_section !== false}
                  onCheckedChange={(v) => updateField("show_featured_section", v)}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground text-destructive">When enabled, the public site will show a maintenance page</p>
                </div>
                <Switch
                  checked={form.maintenance_mode === true}
                  onCheckedChange={(v) => updateField("maintenance_mode", v)}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating save button for mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden z-50">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          size="lg"
          className="rounded-full shadow-lg gap-2"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
