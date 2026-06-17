import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Play, RefreshCw, CheckCircle2, AlertTriangle, ImageIcon } from "lucide-react";

interface BackupJob {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  total: number;
  processed: number;
  succeeded: number;
  skipped: number;
  failed: number;
  current_item: string | null;
  errors: { at: string; msg: string }[];
  started_at: string;
  updated_at: string;
  finished_at: string | null;
}

const AdminBackupPage = () => {
  const [job, setJob] = useState<BackupJob | null>(null);
  const [backedUpCount, setBackedUpCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [preview, setPreview] = useState<{ pendingCount: number; sample: any[] } | null>(null);

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("backup-images-job", {
        body: { action: "status" },
      });
      if (error) throw error;
      setJob(data?.job ?? null);
      setBackedUpCount(data?.backedUpCount ?? 0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("backup-images-job", {
        body: { action: "preview" },
      });
      if (error) throw error;
      setPreview(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load preview");
    }
  };

  const startBackup = async () => {
    setStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("backup-images-job", {
        body: { action: "start" },
      });
      if (error) throw error;
      toast.success(`Backup started — ${data?.total ?? 0} images queued`);
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.message || "Failed to start backup");
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchPreview();
    const iv = setInterval(fetchStatus, 2500);
    return () => clearInterval(iv);
  }, []);

  const pct = job && job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;
  const isRunning = job?.status === "running";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-body">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">Image Backup</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mirrors every article cover, body image, and author avatar to the backup Supabase storage. The job runs server-side — you can close this page and it will keep going.
        </p>
      </header>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Total mirrored</div>
          <div className="text-2xl font-bold text-foreground mt-1">{backedUpCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Pending</div>
          <div className="text-2xl font-bold text-foreground mt-1">{preview?.pendingCount ?? "—"}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Job status</div>
          <div className="text-2xl font-bold text-foreground mt-1 capitalize">{job?.status ?? "idle"}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Failures</div>
          <div className="text-2xl font-bold text-foreground mt-1">{job?.failed ?? 0}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={startBackup}
          disabled={starting || isRunning}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isRunning ? "Running…" : "Start backfill"}
        </button>
        <button
          onClick={() => { fetchStatus(); fetchPreview(); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Progress */}
      {job && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              {job.status === "completed" && <CheckCircle2 className="inline h-5 w-5 text-primary mr-2" />}
              {job.status === "failed" && <AlertTriangle className="inline h-5 w-5 text-destructive mr-2" />}
              Job {job.id.slice(0, 8)}
            </h2>
            <span className="text-sm text-muted-foreground">
              Started {new Date(job.started_at).toLocaleString()}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{job.processed} / {job.total}</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">Succeeded</div>
              <div className="text-lg font-semibold text-foreground">{job.succeeded}</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">Skipped</div>
              <div className="text-lg font-semibold text-foreground">{job.skipped}</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">Failed</div>
              <div className="text-lg font-semibold text-destructive">{job.failed}</div>
            </div>
          </div>

          {job.current_item && isRunning && (
            <div className="text-xs text-muted-foreground truncate">
              <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
              Processing: <span className="font-mono">{job.current_item}</span>
            </div>
          )}

          {job.errors && job.errors.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-destructive font-medium">
                {job.errors.length} error{job.errors.length === 1 ? "" : "s"}
              </summary>
              <ul className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                {job.errors.map((e, i) => (
                  <li key={i} className="text-xs font-mono text-muted-foreground border-l-2 border-destructive/40 pl-2">
                    <span className="text-muted-foreground/70">{new Date(e.at).toLocaleTimeString()}</span> {e.msg}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Pending preview */}
      {preview && preview.sample.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <ImageIcon className="h-5 w-5" /> Sample of pending images
          </h2>
          <ul className="space-y-1 text-xs font-mono">
            {preview.sample.map((p: any, i: number) => (
              <li key={i} className="truncate text-muted-foreground">
                <span className="inline-block w-28 text-foreground/70">{p.context}</span> {p.url}
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && !job && (
        <div className="text-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default AdminBackupPage;
