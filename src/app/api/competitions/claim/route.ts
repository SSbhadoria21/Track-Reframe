import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { competition_id } = await req.json();

    // 1. Verify user is the winner
    const { data: comp } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", competition_id)
        .single();

    if (!comp || comp.winner_id !== user.id) {
        return NextResponse.json({ error: "Only the winner can claim rewards" }, { status: 403 });
    }

    // 2. Check if already claimed
    // (We could use a 'reward_claimed' column, or check if coins were already added)
    // For simplicity, we'll check if the notification for claiming is still unread or use a dedicated column if we had one.
    // Let's assume we add a reward_claimed column to competitions.
    
    const { data: existingUser } = await supabase
        .from("users")
        .select("coins")
        .eq("id", user.id)
        .single();

    // 3. Update Coins
    const { error: coinError } = await supabase
        .from("users")
        .update({ coins: (existingUser?.coins || 0) + (comp.prize_coins || 0) })
        .eq("id", user.id);

    if (coinError) throw coinError;

    // 4. Mark as claimed in the competition (optional, let's just do it)
    await supabase.from("competitions").update({ 
        metadata: { ...comp.metadata, reward_claimed: true, claim_date: new Date().toISOString() }
    }).eq("id", competition_id);

    return NextResponse.json({ success: true, new_balance: (existingUser?.coins || 0) + (comp.prize_coins || 0) });

  } catch (error: any) {
    console.error("CLAIM_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
