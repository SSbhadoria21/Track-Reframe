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
    const { collaborationId, rateeId, rating, reviewText } = body;

    // Save rating
    const { data: ratingRecord, error } = await supabase
      .from("collaboration_ratings")
      .insert({
        collaboration_id: collaborationId,
        rater_id: user.id,
        ratee_id: rateeId,
        rating,
        review_text: reviewText || "",
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger update of user's average rating in 'users' table using rpc
    try {
      await supabase.rpc("calculate_reliability_score", { user_id: rateeId });
    } catch (rpcErr) {
      console.warn("RPC calculate_reliability_score error, falling back to manual update:", rpcErr);
      // Fallback manual calculation if RPC fails
      const { data: ratings } = await supabase
        .from("collaboration_ratings")
        .select("rating")
        .eq("ratee_id", rateeId);

      if (ratings && ratings.length > 0) {
        const totalRatingSum = ratings.reduce((sum, r) => sum + r.rating, 0);
        const avg = parseFloat((totalRatingSum / ratings.length).toFixed(2));
        // Scale reliability score out of 100 based on avg rating (e.g. 5.0 rating = 100 score)
        const reliabilityScore = Math.min(100, Math.round((avg / 5.0) * 100));

        await supabase
          .from("users")
          .update({
            avg_rating_received: avg,
            total_ratings_received: ratings.length,
            // Assuming we save it to profile or a column, or just update the coins/ratings count.
            // Wait, does users table have avg_rating_received and total_ratings_received? Yes, we saw it in the schema!
          })
          .eq("id", rateeId);
      }
    }

    return NextResponse.json({ success: true, rating: ratingRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
