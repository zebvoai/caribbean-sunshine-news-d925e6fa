import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Verify user auth
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

    // Check publish permission
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "editor"])
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Only admins and editors can publish" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { article_id } = await req.json();
    if (!article_id) {
      return new Response(JSON.stringify({ error: "article_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required fields
    const { data: article, error: fetchError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", article_id)
      .single();

    if (fetchError || !article) {
      return new Response(JSON.stringify({ error: "Article not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!article.title || !article.slug || !article.excerpt || !article.body) {
      return new Response(
        JSON.stringify({ error: "Title, slug, excerpt, and body are required to publish" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set defaults for SEO fields
    const metaTitle = article.meta_title || article.title;
    const metaDescription = article.meta_description || article.excerpt;

    const { data: updated, error: updateError } = await supabase
      .from("articles")
      .update({
        publication_status: "published",
        published_at: new Date().toISOString(),
        scheduled_for: null,
        meta_title: metaTitle.substring(0, 60),
        meta_description: metaDescription.substring(0, 160),
      })
      .eq("id", article_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, article: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
