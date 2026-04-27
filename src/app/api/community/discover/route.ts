import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch public communities the user is NOT in
    const { data: rooms, error } = await supabase
      .from("communities")
      .select("*")
      .eq("is_private", false)
      .order("member_count", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ rooms });
  } catch (error: any) {
    console.error("Error discovering rooms:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
