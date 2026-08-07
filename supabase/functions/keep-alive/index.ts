import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const started = Date.now();
  const results: Record<string, unknown> = {};

  try {
    // 1. Touch Postgres so the database instance registers activity.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { error: dbError } = await supabase
      .from("image_backups")
      .select("id", { count: "exact", head: true });
    results.database = dbError ? `error: ${dbError.message}` : "ok";

    // 2. Touch the main data API function so its worker stays warm.
    const apiUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mongo-api?resource=categories`;
    const apiRes = await fetch(apiUrl, {
      headers: {
        apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
    });
    results.mongo_api = apiRes.ok ? "ok" : `status ${apiRes.status}`;
  } catch (e) {
    results.error = e instanceof Error ? e.message : String(e);
  }

  console.log("keep-alive ping", JSON.stringify(results));

  return new Response(
    JSON.stringify({ ...results, ms: Date.now() - started, at: new Date().toISOString() }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
