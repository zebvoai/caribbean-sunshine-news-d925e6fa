// Backfills existing images to the backup Supabase storage and tracks progress
// in the public.backup_jobs table. Uses EdgeRuntime.waitUntil() so processing
// continues server-side even after the browser disconnects/refreshes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "article-images-backup";
const PROCESS_BUDGET_MS = 100_000; // self-relay before hitting the 150s function cap
const BATCH_SIZE = 3;

const BACKUP_URL = Deno.env.get("BACKUP_STORAGE_URL");
const BACKUP_KEY = Deno.env.get("BACKUP_STORAGE_SERVICE_ROLE_KEY");
const PRIMARY_URL = Deno.env.get("SUPABASE_URL")!;
const PRIMARY_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const FUNCTION_URL = `${PRIMARY_URL}/functions/v1/backup-images-job`;

const primary = createClient(PRIMARY_URL, PRIMARY_KEY, {
  auth: { persistSession: false },
});

function backupClient() {
  if (!BACKUP_URL || !BACKUP_KEY) throw new Error("Backup credentials missing");
  return createClient(BACKUP_URL, BACKUP_KEY, { auth: { persistSession: false } });
}

let bucketEnsured = false;
async function ensureBucket(b: ReturnType<typeof createClient>) {
  if (bucketEnsured) return;
  const { data } = await b.storage.getBucket(BUCKET);
  if (!data) {
    await b.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 25 * 1024 * 1024,
    });
  }
  bucketEnsured = true;
}

// Extract every image URL referenced in the project.
async function collectAllImageUrls(): Promise<
  { url: string; context: string }[]
> {
  const out: { url: string; context: string }[] = [];
  const seen = new Set<string>();
  const add = (url: string | null | undefined, context: string) => {
    if (!url) return;
    const u = url.trim();
    if (!u || u.startsWith("data:")) return;
    if (seen.has(u)) return;
    seen.add(u);
    out.push({ url: u, context });
  };

  const { data: articles } = await primary
    .from("articles")
    .select("cover_image_url, body");
  (articles ?? []).forEach((a: any) => {
    add(a.cover_image_url, "article-cover");
    if (typeof a.body === "string") {
      const re = /<img[^>]+src=["']([^"']+)["']/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(a.body))) add(m[1], "article-body");
    }
  });

  const { data: authors } = await primary.from("authors").select("avatar_url");
  (authors ?? []).forEach((a: any) => add(a.avatar_url, "author-avatar"));

  return out;
}

async function pendingUrls() {
  const all = await collectAllImageUrls();
  if (all.length === 0) return [];
  const { data: existing } = await primary
    .from("image_backups")
    .select("primary_url")
    .in("primary_url", all.map((x) => x.url));
  const done = new Set((existing ?? []).map((r: any) => r.primary_url));
  return all.filter((x) => !done.has(x.url));
}

function pathFromUrl(url: string): string {
  // If it lives in the primary Supabase storage, reuse the path.
  const marker = "/storage/v1/object/public/";
  const idx = url.indexOf(marker);
  if (idx >= 0) {
    const rest = url.slice(idx + marker.length); // e.g. article-images/articles/xxx.jpg
    const slash = rest.indexOf("/");
    if (slash > 0) return `backfill/${rest.slice(slash + 1)}`;
  }
  // Otherwise hash the URL for a stable filename.
  const ext = (url.split("?")[0].split(".").pop() || "img").slice(0, 5);
  const hash = btoa(unescape(encodeURIComponent(url)))
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 32);
  return `backfill/external/${hash}.${ext}`;
}

async function appendError(jobId: string, msg: string) {
  const { data } = await primary
    .from("backup_jobs").select("errors").eq("id", jobId).maybeSingle();
  const errs = Array.isArray(data?.errors) ? data!.errors : [];
  errs.push({ at: new Date().toISOString(), msg });
  await primary.from("backup_jobs").update({
    errors: errs.slice(-50),
  }).eq("id", jobId);
}

async function processOne(
  jobId: string,
  item: { url: string; context: string },
) {
  await primary.from("backup_jobs").update({
    current_item: item.url,
    updated_at: new Date().toISOString(),
  }).eq("id", jobId);

  // Skip if already mirrored (race-safe)
  const { data: existing } = await primary
    .from("image_backups").select("id").eq("primary_url", item.url).maybeSingle();
  if (existing) {
    await primary.rpc("set_updated_at"); // noop placeholder; not used
    const { data: job } = await primary.from("backup_jobs")
      .select("processed, skipped").eq("id", jobId).maybeSingle();
    await primary.from("backup_jobs").update({
      processed: (job?.processed ?? 0) + 1,
      skipped: (job?.skipped ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);
    return;
  }

  try {
    const resp = await fetch(item.url, { redirect: "follow" });
    if (!resp.ok) throw new Error(`Fetch ${resp.status}`);
    const contentType =
      resp.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const bytes = new Uint8Array(await resp.arrayBuffer());
    const path = pathFromUrl(item.url);

    const b = backupClient();
    await ensureBucket(b);
    const { error: upErr } = await b.storage.from(BUCKET).upload(path, bytes, {
      contentType, upsert: true, cacheControl: "3600",
    });
    if (upErr) throw new Error(`Upload: ${upErr.message}`);

    const { data: pub } = b.storage.from(BUCKET).getPublicUrl(path);

    await primary.from("image_backups").insert({
      primary_url: item.url,
      backup_url: pub.publicUrl,
      backup_path: path,
      context: item.context,
      content_type: contentType,
      size_bytes: bytes.length,
    });

    const { data: job } = await primary.from("backup_jobs")
      .select("processed, succeeded").eq("id", jobId).maybeSingle();
    await primary.from("backup_jobs").update({
      processed: (job?.processed ?? 0) + 1,
      succeeded: (job?.succeeded ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);
  } catch (err) {
    await appendError(jobId, `${item.url}: ${(err as Error).message}`);
    const { data: job } = await primary.from("backup_jobs")
      .select("processed, failed").eq("id", jobId).maybeSingle();
    await primary.from("backup_jobs").update({
      processed: (job?.processed ?? 0) + 1,
      failed: (job?.failed ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);
  }
}

async function relay(jobId: string) {
  // Fire-and-forget HTTP self-invocation so processing continues after wall-time cap.
  try {
    await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${PRIMARY_KEY}`,
        "x-internal-relay": "1",
      },
      body: JSON.stringify({ action: "resume", jobId }),
    });
  } catch (e) {
    console.error("relay failed", e);
  }
}

async function processLoop(jobId: string) {
  const started = Date.now();
  // Refresh total on each loop iteration in case new items appear.
  while (Date.now() - started < PROCESS_BUDGET_MS) {
    const pending = await pendingUrls();
    if (pending.length === 0) {
      await primary.from("backup_jobs").update({
        status: "completed",
        current_item: null,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", jobId);
      return;
    }
    // Update total estimate
    const { data: job } = await primary.from("backup_jobs")
      .select("processed").eq("id", jobId).maybeSingle();
    await primary.from("backup_jobs").update({
      total: (job?.processed ?? 0) + pending.length,
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    const batch = pending.slice(0, BATCH_SIZE);
    for (const item of batch) {
      await processOne(jobId, item);
    }
  }
  // Time budget exhausted — relay to another invocation.
  await relay(jobId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "status";

    // Internal relay path (no user auth required, uses service role bearer)
    if (action === "resume") {
      const auth = req.headers.get("authorization") ?? "";
      if (!auth.includes(PRIMARY_KEY)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const jobId = body.jobId as string;
      // @ts-ignore EdgeRuntime exists in Supabase Deno
      EdgeRuntime.waitUntil(processLoop(jobId));
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticated path — verify caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(PRIMARY_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await primary.rpc("has_role", {
      _user_id: claims.claims.sub, _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      const { data: job } = await primary.from("backup_jobs")
        .select("*").order("started_at", { ascending: false }).limit(1).maybeSingle();
      const { count: backedUpCount } = await primary
        .from("image_backups").select("*", { count: "exact", head: true });
      return new Response(JSON.stringify({ job, backedUpCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "start") {
      // Mark any orphan running jobs as failed
      await primary.from("backup_jobs").update({
        status: "failed", finished_at: new Date().toISOString(),
      }).eq("status", "running");

      const pending = await pendingUrls();
      const { data: job, error } = await primary.from("backup_jobs").insert({
        status: "running", total: pending.length,
      }).select("id").single();
      if (error) throw error;

      // @ts-ignore
      EdgeRuntime.waitUntil(processLoop(job.id));

      return new Response(JSON.stringify({ jobId: job.id, total: pending.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "preview") {
      const pending = await pendingUrls();
      return new Response(JSON.stringify({
        pendingCount: pending.length,
        sample: pending.slice(0, 10),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[backup-images-job] error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
