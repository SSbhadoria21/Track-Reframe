import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const filmTypes = searchParams.get("filmTypes")?.split(",").filter(Boolean) || [];
    const categories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const prestige = searchParams.get("prestige")?.split(",").filter(Boolean) || [];
    const region = searchParams.get("region") || "Both"; // India, International, Both
    const freeOnly = searchParams.get("freeOnly") === "true";
    const maxFee = searchParams.get("maxFee") ? parseInt(searchParams.get("maxFee")!) : null;
    const deadlineFilter = searchParams.get("deadline") || "All"; // 30days, 3months, 6months, All
    const language = searchParams.get("language") || "Any";

    // 1. Build Query
    let query = supabase
      .from("festivals")
      .select(`
        *,
        festival_deadlines (*)
      `)
      .eq("is_active", true);

    // Filter by Region
    if (region === "India") {
      query = query.eq("country", "India");
    } else if (region === "International") {
      query = query.neq("country", "India");
    }

    // Full-Text Search fallback using ilike
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%,country.ilike.%${search}%`);
    }

    const { data: festivals, error } = await query;

    if (error) {
      console.error("Fetch festivals error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filtered = festivals || [];

    // 2. Perform Memory Filters (for array overlaps & deadline ranges)
    if (filmTypes.length > 0) {
      filtered = filtered.filter((f) =>
        f.film_types_accepted?.some((t: string) => filmTypes.includes(t))
      );
    }

    if (categories.length > 0) {
      filtered = filtered.filter((f) =>
        f.categories?.some((c: string) => categories.includes(c))
      );
    }

    if (prestige.length > 0) {
      filtered = filtered.filter((f) => {
        if (prestige.includes("Oscar Qualifying") && f.is_oscar_qualifying) return true;
        if (prestige.includes("BAFTA Qualifying") && f.is_bafta_qualifying) return true;
        if (prestige.includes("Tier 1") && f.prestige_level === "tier1") return true;
        if (prestige.includes("Tier 2") && f.prestige_level === "tier2") return true;
        if (prestige.includes("Emerging Festivals") && f.prestige_level === "emerging") return true;
        return false;
      });
    }

    if (language !== "Any") {
      filtered = filtered.filter((f) =>
        f.language_restrictions?.length === 0 || f.language_restrictions?.includes(language)
      );
    }

    // Process deadlines
    const now = new Date();
    filtered = filtered.map((f) => {
      // Find the active upcoming deadline or the next one
      const deadlines = f.festival_deadlines || [];
      const upcoming = deadlines
        .filter((d: any) => new Date(d.deadline_date) >= now)
        .sort((a: any, b: any) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime());

      // If no upcoming, take the latest passed deadline
      const activeDeadline = upcoming[0] || deadlines.sort((a: any, b: any) => new Date(b.deadline_date).getTime() - new Date(a.deadline_date).getTime())[0];

      return {
        ...f,
        active_deadline: activeDeadline || null,
      };
    });

    // Filter by free status or fees
    if (freeOnly) {
      filtered = filtered.filter((f) => f.active_deadline?.is_free || f.is_free);
    } else if (maxFee !== null) {
      filtered = filtered.filter((f) => {
        if (!f.active_deadline) return true;
        const fee = f.active_deadline.fee_inr || 0;
        return fee <= maxFee;
      });
    }

    // Filter by deadline range
    if (deadlineFilter !== "All") {
      const targetDate = new Date();
      if (deadlineFilter === "30days") {
        targetDate.setDate(targetDate.getDate() + 30);
      } else if (deadlineFilter === "3months") {
        targetDate.setMonth(targetDate.getMonth() + 3);
      } else if (deadlineFilter === "6months") {
        targetDate.setMonth(targetDate.getMonth() + 6);
      }

      filtered = filtered.filter((f) => {
        if (!f.active_deadline) return false;
        const dDate = new Date(f.active_deadline.deadline_date);
        return dDate >= now && dDate <= targetDate;
      });
    }

    return NextResponse.json({ festivals: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to query festivals" }, { status: 500 });
  }
}
