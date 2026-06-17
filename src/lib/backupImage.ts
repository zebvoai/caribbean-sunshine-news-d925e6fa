// Fire-and-forget mirror to backup Supabase storage.
// Never blocks or fails the primary upload UX — backup errors are logged only.
import { supabase } from "@/integrations/supabase/client";

async function fileToBase64(file: File | Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return btoa(binary);
}

export async function mirrorToBackup(opts: {
  file: File;
  path: string;
  primaryUrl: string;
  context: "article-cover" | "author-avatar" | "article-body" | string;
}) {
  try {
    const base64 = await fileToBase64(opts.file);
    const { data, error } = await supabase.functions.invoke("backup-image", {
      body: {
        path: opts.path,
        contentType: opts.file.type,
        base64,
        primary_url: opts.primaryUrl,
        context: opts.context,
        original_filename: opts.file.name,
        size_bytes: opts.file.size,
      },
    });
    if (error) {
      console.warn("[backup-image] mirror failed:", error.message);
      return null;
    }
    console.log("[backup-image] mirrored:", data);
    return data as { backup_url: string; backup_path: string };
  } catch (err) {
    console.warn("[backup-image] mirror exception:", err);
    return null;
  }
}
