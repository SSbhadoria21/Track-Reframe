import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { competition_id, winner_id, submission_id } = await req.json();

    // 1. Verify admin is creator
    const { data: comp, error: compFetchError } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", competition_id)
        .single();

    if (compFetchError || !comp) throw new Error("Competition not found");
    if (comp.creator_id !== adminUser.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Fetch winner details
    const { data: winner } = await supabase
        .from("users")
        .select("display_name, coins")
        .eq("id", winner_id)
        .single();

    if (!winner) throw new Error("Winner not found");

    // 3. Mark competition as finished
    // Ensure 'finished' is a valid status. Fallback to a check or use a known one.
    const { error: statusError } = await supabase.from("competitions").update({ 
        status: "finished",
        winner_id: winner_id 
    }).eq("id", competition_id);
    
    if (statusError) {
        console.error("STATUS_UPDATE_ERROR:", statusError);
        throw new Error(`Failed to update competition status: ${statusError.message}`);
    }

    // 4. Mark submission as winner
    await supabase.from("competition_submissions").update({ 
        submission_status: "winner",
        round2_status: "winner"
    }).eq("id", submission_id);

    // 5. Generate Certificate Record (Safe insert)
    try {
        const { data: cert, error: certError } = await supabase.from("certificates").insert({
            user_id: winner_id,
            competition_id: competition_id,
            submission_id: submission_id,
            title: `Official Winner: ${comp.title}`,
            production_name: comp.host_production_name || "Track Reframe Production",
            company_name: comp.host_company_name || "Track Reframe",
            metadata: {
                host_contact: comp.host_contact_info,
                prize_coins: comp.prize_coins,
                theme: comp.theme
            }
        }).select().single();

        if (cert && !certError) {
            // 6. Send Notifications
            await supabase.from("notifications").insert({
                user_id: winner_id,
                type: "system",
                title: "🏆 CHALLENGE VICTORY!",
                body: `Congratulations! You have been announced as the winner of "${comp.title}". Claim your rewards in your dashboard.`,
                related_entity_type: "certificate",
                related_entity_id: cert.id
            });
        }
    } catch (certErr) {
        console.error("CERTIFICATE_GEN_FAILED:", certErr);
        // Continue anyway as the winner is already marked in DB
    }

    // 7. Automated Global Post (Non-blocking)
    try {
        await supabase.from("posts").insert({
            user_id: adminUser.id,
            type: "text",
            content: `🏆 HALL OF FAME: ${winner.display_name} has just won the "${comp.title}" Challenge! \n\nOrganized by: ${comp.host_production_name || 'Track Reframe'}\n\nView the masterpiece and award details in the Past Winners tab.`,
            is_competition_entry: false,
            competition_id: competition_id
        });
    } catch (postErr) {
        console.error("ANNOUNCEMENT_POST_FAILED:", postErr);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("RESULTS_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
