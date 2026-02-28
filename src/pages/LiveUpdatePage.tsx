import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { mongoApi, MongoLiveUpdate, LiveBlogEntry } from "@/lib/mongoApi";
import { getProxiedAssetUrl } from "@/lib/networkProxy";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import PageLoader from "@/components/PageLoader";
import { Calendar, ChevronRight, Facebook, Twitter, Link2, Pin, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const POLL_INTERVAL = 30_000; // 30 seconds

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(iso);
};

const LiveUpdatePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [update, setUpdate] = useState<MongoLiveUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LiveBlogEntry[]>([]);
  const [newEntriesCount, setNewEntriesCount] = useState(0);
  const lastEntryTimeRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial load
  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await mongoApi.getLiveUpdateBySlug(slug);
        setUpdate(data);
        const sorted = (data.entries || []).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setEntries(sorted);
        if (sorted.length > 0) {
          lastEntryTimeRef.current = sorted[0].created_at;
        }
      } catch {
        navigate("/404", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, navigate]);

  // Auto-polling for new entries
  useEffect(() => {
    if (!update?.is_live || !update?.id) return;

    const poll = async () => {
      try {
        const result = await mongoApi.pollLiveEntries(
          update.id,
          lastEntryTimeRef.current || undefined
        );
        if (result.entries.length > 0) {
          setEntries((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newOnes = result.entries.filter((e) => !existingIds.has(e.id));
            if (newOnes.length === 0) return prev;
            const updated = [...newOnes, ...prev];
            lastEntryTimeRef.current = updated[0].created_at;
            setNewEntriesCount((c) => c + newOnes.length);
            return updated;
          });
        }
        // Update live status if it changed
        if (!result.is_live && update.is_live) {
          setUpdate((prev) => prev ? { ...prev, is_live: false, summary: result.summary } : prev);
        }
      } catch {
        // silent fail on poll
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [update?.is_live, update?.id]);

  // Clear new count when user scrolls to top
  useEffect(() => {
    if (newEntriesCount > 0) {
      const timer = setTimeout(() => setNewEntriesCount(0), 5000);
      return () => clearTimeout(timer);
    }
  }, [newEntriesCount]);

  // Share
  const shareUrl = `https://www.dominicanews.dm/live/${slug}`;
  const shareFacebook = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
  const shareTwitter = () =>
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(update?.title || "")}`, "_blank");
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied", description: "Article link copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageLoader />
        <SiteHeader />
        <NavBar />
        <main className="max-w-4xl mx-auto px-6 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-64 bg-muted rounded" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!update) return null;

  const coverSrc = update.cover_image_url ? getProxiedAssetUrl(update.cover_image_url) : null;
  const pinnedEntries = entries.filter((e) => e.is_pinned);
  const timelineEntries = entries;

  // Group entries by date
  const groupedByDate: Record<string, LiveBlogEntry[]> = {};
  timelineEntries.forEach((e) => {
    const dateKey = formatDate(e.created_at);
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(e);
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 font-body">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate max-w-[260px]">{update.title}</span>
        </nav>

        {/* LIVE / ENDED badge + viewer info */}
        <div className="flex items-center gap-3 mb-4">
          {update.is_live ? (
            <span className="inline-flex items-center gap-1.5 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
              ENDED
            </span>
          )}
          {update.updated_at && (
            <span className="text-xs text-muted-foreground">
              Updated {formatRelative(update.updated_at)}
            </span>
          )}
          {update.is_live && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Auto-refreshing
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground leading-tight mb-4">
          {update.title}
        </h1>

        {/* Excerpt */}
        {update.excerpt && (
          <p className="text-lg text-muted-foreground font-body leading-relaxed mb-6 border-l-4 border-primary pl-4">
            {update.excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
          {update.published_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(update.published_at)}
            </span>
          )}
          <span>{entries.length} updates</span>
        </div>

        {/* Share */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-sm font-semibold text-foreground mr-1">Share:</span>
          <button onClick={shareFacebook} className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors" title="Share on Facebook">
            <Facebook className="h-4 w-4 text-foreground" />
          </button>
          <button onClick={shareTwitter} className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors" title="Share on Twitter">
            <Twitter className="h-4 w-4 text-foreground" />
          </button>
          <button onClick={copyLink} className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors" title="Copy link">
            <Link2 className="h-4 w-4 text-foreground" />
          </button>
        </div>

        {/* Cover image */}
        {coverSrc && (
          <figure className="mb-8">
            <img
              src={coverSrc}
              alt={update.cover_image_alt || update.title}
              className="w-full rounded-lg object-cover max-h-[500px]"
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </figure>
        )}

        {/* Summary / Recap — shown when blog has ended */}
        {!update.is_live && update.summary && (
          <div className="mb-10 p-6 bg-muted/30 rounded-xl border border-border">
            <h2 className="text-xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              📋 Summary
            </h2>
            <div
              className="prose prose-lg max-w-none font-body text-foreground
                prose-headings:font-heading prose-headings:text-foreground
                prose-a:text-primary prose-a:underline
                prose-img:rounded-lg prose-img:mx-auto
                prose-blockquote:border-primary prose-blockquote:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: update.summary }}
            />
          </div>
        )}

        {/* New entries notification */}
        {newEntriesCount > 0 && (
          <div className="sticky top-2 z-10 mb-4 flex justify-center">
            <button
              onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setNewEntriesCount(0); }}
              className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce"
            >
              {newEntriesCount} new update{newEntriesCount > 1 ? "s" : ""} ↑
            </button>
          </div>
        )}

        {/* Pinned entries at the top */}
        {pinnedEntries.length > 0 && (
          <div className="mb-8 space-y-4">
            {pinnedEntries.map((entry) => (
              <div key={entry.id} className="border-2 border-primary/30 rounded-xl p-5 bg-primary/5">
                <div className="flex items-center gap-2 mb-3 text-xs text-primary font-bold uppercase">
                  <Pin className="h-3.5 w-3.5" />
                  Pinned Update
                  <span className="text-muted-foreground font-normal ml-auto">
                    {formatTime(entry.created_at)}
                  </span>
                </div>
                {entry.image_url && (
                  <img
                    src={getProxiedAssetUrl(entry.image_url)}
                    alt={entry.image_alt || ""}
                    className="w-full max-h-80 object-cover rounded-lg mb-3"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div
                  className="prose prose-sm max-w-none font-body text-foreground
                    prose-headings:font-heading prose-a:text-primary prose-img:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        {entries.length > 0 ? (
          <div className="space-y-0">
            <h2 className="text-lg font-heading font-bold text-foreground mb-6">
              {update.is_live ? "Live Reporting" : "Full Timeline"}
            </h2>
            {Object.entries(groupedByDate).map(([date, dayEntries]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="relative border-l-2 border-destructive/20 ml-3 space-y-0">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="relative pl-6 pb-6 group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[7px] top-2 w-3 h-3 rounded-full border-2 border-background ${
                        entry.is_pinned ? "bg-primary" : "bg-destructive/60"
                      }`} />

                      <div className="rounded-lg">
                        {/* Time */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-foreground">
                            {formatTime(entry.created_at)}
                          </span>
                          {entry.author_name && (
                            <span className="text-xs text-muted-foreground">
                              by {entry.author_name}
                            </span>
                          )}
                          {entry.is_pinned && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold">
                              <Pin className="h-3 w-3" /> Pinned
                            </span>
                          )}
                        </div>

                        {/* Entry image */}
                        {entry.image_url && (
                          <img
                            src={getProxiedAssetUrl(entry.image_url)}
                            alt={entry.image_alt || ""}
                            className="w-full max-h-80 object-cover rounded-lg mb-3"
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        )}

                        {/* Entry content */}
                        <div
                          className="prose prose-sm max-w-none font-body text-foreground
                            prose-headings:font-heading prose-a:text-primary prose-a:underline
                            prose-img:rounded-lg prose-img:mx-auto
                            prose-blockquote:border-primary prose-blockquote:text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: entry.content }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">No updates yet.</p>
            {update.is_live && (
              <p className="text-sm">Stay tuned — updates will appear here automatically.</p>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default LiveUpdatePage;
