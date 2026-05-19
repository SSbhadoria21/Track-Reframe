import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const userId = userProfile.id;

    // Rate Limiting Check (10 uploads per user per day, reset at midnight IST)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istMidnight = new Date(now.getTime() + istOffset);
    istMidnight.setUTCHours(0, 0, 0, 0);
    const utcMidnight = new Date(istMidnight.getTime() - istOffset).toISOString();

    let usageCount = 0;
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      const cleanUrl = redisUrl.replace(/\/$/, "");
      const redisKey = `ocr_limit:${userId}`;
      const getRes = await fetch(`${cleanUrl}/get/${redisKey}`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      if (getRes.ok) {
        const getVal = await getRes.json();
        usageCount = parseInt(getVal.result || "0", 10);
      }
    } else {
      const { count } = await supabaseAdmin
        .from("ai_usage_tracking")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("tool_type", "ocr-extract")
        .gte("created_at", utcMidnight);
      
      usageCount = count || 0;
    }

    return NextResponse.json({ count: usageCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
