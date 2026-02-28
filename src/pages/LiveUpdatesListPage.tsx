import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/SiteHeader";
import NavBar from "@/components/NavBar";
import SiteFooter from "@/components/SiteFooter";
import { mongoApi, MongoLiveUpdate } from "@/lib/mongoApi";
import { getProxiedAssetUrl } from "@/lib/networkProxy";
import { Radio } from "lucide-react";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

const LiveUpdateCard = ({ update }: { update: MongoLiveUpdate }) => (
  <Link to={`/live/${update.slug}`} className="block group">
    <div className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {update.cover_image_url && (
        <img
          src={getProxiedAssetUrl(update.cover_image_url)}
          alt={update.cover_image_alt || update.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.dataset.fallbackApplied === "true") {
              img.style.display = "none";
              return;
            }
            img.dataset.fallbackApplied = "true";
            img.src = "/placeholder.svg";
          }}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {update.is_live ? (
            <span className="inline-flex items-center gap-1 bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
              ENDED
            </span>
          )}
          {update.updated_at && (
            <span className="text-xs text-muted-foreground">
              {formatDate(update.updated_at)} · {formatTime(update.updated_at)}
            </span>
          )}
        </div>
        <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
          {update.title}
        </h3>
        {update.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 font-body">
            {update.excerpt}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span>{update.entries_count || 0} updates</span>
          {update.view_count > 0 && <span>{update.view_count} views</span>}
        </div>
      </div>
    </div>
  </Link>
);

const LiveUpdatesListPage = () => {
  const { data: liveUpdates = [], isLoading } = useQuery({
    queryKey: ["live-updates-all"],
    queryFn: () => mongoApi.getLiveUpdates(),
    staleTime: 60 * 1000,
  });

  const activeUpdates = liveUpdates.filter((u) => u.is_live);
  const endedUpdates = liveUpdates.filter((u) => !u.is_live);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Page heading */}
        <div className="flex items-center gap-3">
          <Radio className="h-6 w-6 text-destructive" />
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Live Updates
          </h1>
          <div className="flex-1 h-px bg-border" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg bg-muted animate-pulse h-72" />
            ))}
          </div>
        ) : liveUpdates.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-body">
            <p className="text-lg">No live updates yet.</p>
          </div>
        ) : (
          <>
            {/* Active / Currently Live */}
            {activeUpdates.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                  <h2 className="text-lg font-heading font-bold text-destructive uppercase tracking-wider">
                    Currently Live
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeUpdates.map((u) => (
                    <LiveUpdateCard key={u.id} update={u} />
                  ))}
                </div>
              </section>
            )}

            {/* Ended Updates */}
            {endedUpdates.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-heading font-bold text-foreground">
                    Past Coverage
                  </h2>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {endedUpdates.map((u) => (
                    <LiveUpdateCard key={u.id} update={u} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default LiveUpdatesListPage;
