import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: scores } = await supabase
      .from("daily_scores")
      .select("score_date, total_xp")
      .eq("user_id", user.id)
      .order("score_date", { ascending: true });

    const compoundXP = (scores ?? []).reduce((sum, s) => sum + s.total_xp, 0);

    return NextResponse.json({
      scores: scores ?? [],
      compound_xp: compoundXP,
    });
  } catch (err) {
    console.error("Lifetime scores error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
