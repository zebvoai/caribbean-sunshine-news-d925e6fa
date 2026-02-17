import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_PINNED = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "editor"])
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Only admins and editors can pin articles" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { article_id, pin } = await req.json();
    if (!article_id) {
      return new Response(JSON.stringify({ error: "article_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (pin) {
      // Count currently pinned articles
      const { data: pinned, error: countError } = await supabase
        .from("articles")
        .select("id, updated_at")
        .eq("is_pinned", true)
        .order("updated_at", { ascending: true });

      if (countError) throw countError;

      if (pinned && pinned.length >= MAX_PINNED) {
        // Unpin the oldest pinned article
        await supabase
          .from("articles")
          .update({ is_pinned: false })
          .eq("id", pinned[0].id);
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("articles")
      .update({ is_pinned: pin })
      .eq("id", article_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        article: updated,
        message: pin ? "Article pinned" : "Article unpinned",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
