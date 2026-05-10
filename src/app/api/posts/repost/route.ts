import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { post_id, quote_content } = body;

    if (!post_id) return Response.json({ error: "Post ID required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("post_reposts")
      .insert({
        post_id,
        user_id: user.id,
        quote_content: quote_content || null
      });

    if (error) {
      if (error.code === '23505') {
        // already reposted, ignore or delete? Let's just say already reposted.
        return Response.json({ error: "Already reposted" }, { status: 400 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
