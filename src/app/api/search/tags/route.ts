import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    // Fetch recent posts to aggregate trending tags
    const { data: posts, error } = await supabaseAdmin
      .from("posts")
      .select("content, genre_tags")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    const tagCounts: Record<string, number> = {};

    posts.forEach((post: any) => {
      // 1. Tags from genre_tags array
      if (Array.isArray(post.genre_tags)) {
        post.genre_tags.forEach((tag: string) => {
          const t = tag.startsWith("#") ? tag : `#${tag}`;
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      }

      // 2. Tags from content text
      if (post.content) {
        // Regex to find hashtags
        const matches = post.content.match(/#[\w\u0590-\u05ff]+/g);
        if (matches) {
          matches.forEach((m: string) => {
            const t = m;
            tagCounts[t] = (tagCounts[t] || 0) + 1;
          });
        }
      }
    });

    let tags = Object.entries(tagCounts).map(([tag, count]) => ({ tag, count }));

    if (query) {
      const q = query.startsWith("#") ? query : `#${query}`;
      tags = tags.filter((t) => t.tag.toLowerCase().includes(q.toLowerCase()));
    }

    // Sort by count (descending)
    tags.sort((a, b) => b.count - a.count);

    return Response.json({ tags: tags.slice(0, 10) });
  } catch (error: any) {
    console.error("Search Tags API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
