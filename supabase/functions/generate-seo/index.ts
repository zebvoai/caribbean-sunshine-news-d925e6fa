import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { title, excerpt, body } = await req.json();

    if (!title && !excerpt && !body) {
      return new Response(
        JSON.stringify({ error: "Provide at least a title, excerpt, or body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip HTML tags from body for context
    const plainBody = (body || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().substring(0, 2000);

    const systemPrompt = `You are an SEO expert for a Caribbean news website called "Dominica News DM". Generate optimized meta title and meta description following Google's SEO guidelines.

Rules:
- Meta title: 50-60 characters max. Include the most important keywords naturally. Make it compelling for click-through. Do NOT include the site name — it will be appended automatically.
- Meta description: 120-160 characters. Summarize the article concisely. Include a call-to-action or key detail. Use active voice.
- Both must be in English and factually accurate based on the provided content.
- Do NOT use clickbait or misleading text.`;

    const userPrompt = `Generate an SEO-optimized meta title and meta description for this news article:

Title: ${title || "(not provided)"}
Excerpt: ${excerpt || "(not provided)"}
Body excerpt: ${plainBody || "(not provided)"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_seo_fields",
              description: "Set the SEO meta title and meta description for the article",
              parameters: {
                type: "object",
                properties: {
                  meta_title: {
                    type: "string",
                    description: "SEO-optimized meta title, 50-60 characters",
                  },
                  meta_description: {
                    type: "string",
                    description: "SEO-optimized meta description, 120-160 characters",
                  },
                },
                required: ["meta_title", "meta_description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_seo_fields" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured output" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const seo = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        meta_title: (seo.meta_title || "").substring(0, 60),
        meta_description: (seo.meta_description || "").substring(0, 160),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-seo error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
