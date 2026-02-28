import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { mongoApi, MongoLiveUpdate } from "@/lib/mongoApi";
import { getProxiedAssetUrl } from "@/lib/networkProxy";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import PageLoader from "@/components/PageLoader";
import { Calendar, Clock, ChevronRight, Facebook, Twitter, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }) +
  " | " +
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

const LiveUpdatePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [update, setUpdate] = useState<MongoLiveUpdate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await mongoApi.getLiveUpdateBySlug(slug);
        setUpdate(data);
      } catch {
        navigate("/404", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, navigate]);

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

        {/* LIVE badge */}
        <div className="flex items-center gap-3 mb-4">
          {update.is_live ? (
            <span className="inline-flex items-center gap-1.5 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              ENDED
            </span>
          )}
          {update.updated_at && (
            <span className="text-xs text-muted-foreground">
              Last updated: {formatDate(update.updated_at)}
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
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-4 border-b border-border">
          {update.published_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(update.published_at)}
            </span>
          )}
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
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </figure>
        )}

        {/* Body */}
        {update.body && (
          <article
            className="prose prose-lg max-w-none font-body text-foreground
              prose-headings:font-heading prose-headings:text-foreground
              prose-a:text-primary prose-a:underline
              prose-img:rounded-lg prose-img:mx-auto
              prose-blockquote:border-primary prose-blockquote:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: update.body }}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default LiveUpdatePage;
