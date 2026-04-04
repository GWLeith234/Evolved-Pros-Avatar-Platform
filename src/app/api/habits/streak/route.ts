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

    // Fetch last 30 daily_scores sorted DESC
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: scores } = await supabase
      .from("daily_scores")
      .select("score_date, habits_done, habits_total")
      .eq("user_id", user.id)
      .gte("score_date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("score_date", { ascending: false });

    if (!scores || scores.length === 0) {
      return NextResponse.json({ current_streak: 0, longest_streak: 0, grace_days_used: 0 });
    }

    // Walk backwards from today calculating streak
    const today = new Date();
    let currentStreak = 0;
    let graceDaysUsed = 0;
    let consecutiveMissed = 0;

    const scoreMap = new Map<string, { done: number; total: number }>();
    for (const s of scores) {
      scoreMap.set(s.score_date, { done: s.habits_done, total: s.habits_total });
    }

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const score = scoreMap.get(dateStr);

      if (!score || score.total === 0) {
        // No data for this day — count as missed
        consecutiveMissed++;
        if (consecutiveMissed >= 2) break; // 2+ consecutive = streak ends
        graceDaysUsed++;
        continue;
      }

      const hit = score.done / score.total >= 0.7;
      if (hit) {
        currentStreak++;
        consecutiveMissed = 0;
      } else {
        consecutiveMissed++;
        if (consecutiveMissed >= 2) break;
        graceDaysUsed++;
      }
    }

    // Upsert streak_records
    const { data: activeRecord } = await supabase
      .from("streak_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    const todayStr = today.toISOString().split("T")[0];

    // Fetch longest streak for personal best check
    const { data: allStreaks } = await supabase
      .from("streak_records")
      .select("streak_length")
      .eq("user_id", user.id)
      .order("streak_length", { ascending: false })
      .limit(1);

    const longestPrevious = allStreaks?.[0]?.streak_length ?? 0;
    const isPersonalBest = currentStreak > longestPrevious;

    if (currentStreak > 0) {
      if (activeRecord) {
        await supabase
          .from("streak_records")
          .update({
            streak_end: todayStr,
            streak_length: currentStreak,
            is_personal_best: isPersonalBest,
          })
          .eq("id", activeRecord.id);
      } else {
        await supabase
          .from("streak_records")
          .insert({
            user_id: user.id,
            streak_start: todayStr,
            streak_end: todayStr,
            streak_length: currentStreak,
            is_active: true,
            is_personal_best: isPersonalBest,
          });
      }
    } else if (activeRecord) {
      // End the active streak
      await supabase
        .from("streak_records")
        .update({ is_active: false })
        .eq("id", activeRecord.id);
    }

    return NextResponse.json({
      current_streak: currentStreak,
      longest_streak: Math.max(currentStreak, longestPrevious),
      grace_days_used: graceDaysUsed,
    });
  } catch (err) {
    console.error("Streak calculation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
