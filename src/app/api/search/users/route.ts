import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    let queryBuilder = supabaseAdmin
      .from("users")
      .select("id, username, display_name, avatar_url")
      .order("display_name", { ascending: true })
      .limit(20);

    if (query) {
      // Search in both display_name and username
      queryBuilder = queryBuilder.or(`display_name.ilike.%${query}%,username.ilike.%${query}%`);
    }

    const { data: users, error } = await queryBuilder;

    if (error) throw error;

    return Response.json({ users });
  } catch (error: any) {
    console.error("Search Users API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
