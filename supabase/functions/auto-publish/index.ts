import { MongoClient, ObjectId } from "npm:mongodb@6";
import { pingIndexNow } from "../_shared/indexnow.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

let cachedClient: MongoClient | null = null;

async function getDb() {
  if (!cachedClient) {
    const uri = Deno.env.get("MONGODB_URI");
    if (!uri) throw new Error("MONGODB_URI is not configured");
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  return cachedClient.db("test");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const db = await getDb();
    const now = new Date();

    const filter = { status: "scheduled", scheduledFor: { $lte: now } };
    const due = await db.collection("articles")
      .find(filter, { projection: { slug: 1 } })
      .toArray();

    const result = await db.collection("articles").updateMany(filter, {
      $set: { status: "published", publishedAt: now, updatedAt: now },
    });

    if (result.modifiedCount > 0) {
      await pingIndexNow(due.map((d: any) => d.slug));
    }

    return new Response(
      JSON.stringify({
        success: true,
        published: result.modifiedCount,
        checked_at: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("auto-publish error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
