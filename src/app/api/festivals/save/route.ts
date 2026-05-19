import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { festivalId, action } = body; // action: 'save' | 'unsave'

    if (action === "unsave") {
      const { error } = await supabase
        .from("saved_festivals")
        .delete()
        .eq("user_id", user.id)
        .eq("festival_id", festivalId);

      if (error) throw error;
      return NextResponse.json({ success: true, saved: false });
    } else {
      const { error } = await supabase
        .from("saved_festivals")
        .upsert({
          user_id: user.id,
          festival_id: festivalId,
        });

      if (error) throw error;
      return NextResponse.json({ success: true, saved: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
