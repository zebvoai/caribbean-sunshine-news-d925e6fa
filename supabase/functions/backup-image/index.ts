// Mirrors uploaded images to a secondary Supabase Storage bucket
// and records the mapping in the primary database so we can reconnect
// articles to images later even if the primary DB changes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "article-images-backup";

const BACKUP_URL = Deno.env.get("BACKUP_STORAGE_URL");
const BACKUP_KEY = Deno.env.get("BACKUP_STORAGE_SERVICE_ROLE_KEY");
const PRIMARY_URL = Deno.env.get("SUPABASE_URL");
const PRIMARY_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

let bucketEnsured = false;

async function ensureBucket(client: ReturnType<typeof createClient>) {
  if (bucketEnsured) return;
  const { data } = await client.storage.getBucket(BUCKET);
  if (!data) {
    await client.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    });
  }
  bucketEnsured = true;
}

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!BACKUP_URL || !BACKUP_KEY) {
      throw new Error("Backup storage credentials not configured");
    }
    if (!PRIMARY_URL || !PRIMARY_KEY) {
      throw new Error("Primary database credentials not configured");
    }

    const body = await req.json();
    const {
      path,
      contentType,
      base64,
      primary_url,
      context,
      original_filename,
      size_bytes,
    } = body ?? {};

    if (!path || !contentType || !base64 || !primary_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const backupClient = createClient(BACKUP_URL, BACKUP_KEY, {
      auth: { persistSession: false },
    });
    const primaryClient = createClient(PRIMARY_URL, PRIMARY_KEY, {
      auth: { persistSession: false },
    });

    await ensureBucket(backupClient);

    const bytes = decodeBase64(base64);

    const { error: upErr } = await backupClient.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType, upsert: false, cacheControl: "3600" });
    if (upErr) throw new Error(`Backup upload failed: ${upErr.message}`);

    const { data: urlData } = backupClient.storage.from(BUCKET).getPublicUrl(path);
    const backup_url = urlData.publicUrl;

    const { error: insErr } = await primaryClient.from("image_backups").insert({
      primary_url,
      backup_url,
      backup_path: path,
      context: context ?? null,
      original_filename: original_filename ?? null,
      content_type: contentType,
      size_bytes: size_bytes ?? null,
    });
    if (insErr) {
      console.error("Mapping insert failed:", insErr);
      // Don't fail the request — the file is safely backed up.
    }

    return new Response(
      JSON.stringify({ backup_url, backup_path: path }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[backup-image] error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
