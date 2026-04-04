import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hasTierAccess } from "@/lib/tier";
import type { Database } from "@/lib/supabase/types";
import CompoundBoardClient from "@/components/habits/CompoundBoardClient";
import CompoundBoardLocked from "@/components/habits/CompoundBoardLocked";

type Habit = Database["public"]["Tables"]["habits"]["Row"];
type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];
type DailyScore = Database["public"]["Tables"]["daily_scores"]["Row"];
type StreakRecord = Database["public"]["Tables"]["streak_records"]["Row"];

export default async function HabitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch creator (user) + tier
  const { data: creator } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!creator) {
    redirect("/auth/login");
  }

  // Tier gate — show locked overlay instead of redirect
  if (!hasTierAccess(creator.tier, "vip")) {
    return <CompoundBoardLocked />;
  }

  const today = new Date().toISOString().split("T")[0];

  // Fetch active habits
  const { data: habits } = (await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order")) as { data: Habit[] | null };

  // Fetch today's logs
  const { data: todayLogs } = (await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed_on", today)) as { data: HabitLog[] | null };

  // Fetch last 7 daily_scores for week bar
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const { data: weekScores } = (await supabase
    .from("daily_scores")
    .select("*")
    .eq("user_id", user.id)
    .gte("score_date", sevenDaysAgo.toISOString().split("T")[0])
    .order("score_date")) as { data: DailyScore[] | null };

  // Fetch active streak
  const { data: activeStreak } = (await supabase
    .from("streak_records")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single()) as { data: StreakRecord | null };

  // Calculate today's XP
  const todayXP = (todayLogs ?? []).reduce((s, l) => s + l.xp_earned + l.bonus_xp, 0);

  return (
    <CompoundBoardClient
      habits={habits ?? []}
      todayLogs={todayLogs ?? []}
      weekScores={weekScores ?? []}
      activeStreak={activeStreak}
      todayXP={todayXP}
      creatorName={creator.name}
    />
  );
}
