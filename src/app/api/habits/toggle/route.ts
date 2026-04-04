import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { habit_id, action, date } = await request.json();
    const completedOn = date ?? new Date().toISOString().split("T")[0];

    if (!habit_id || !action) {
      return NextResponse.json(
        { error: "Missing habit_id or action" },
        { status: 400 }
      );
    }

    // Verify habit belongs to user
    const { data: habit, error: habitErr } = await supabase
      .from("habits")
      .select("id, xp_value, user_id")
      .eq("id", habit_id)
      .single();

    if (habitErr || !habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    if (habit.user_id !== user.id) {
      return NextResponse.json({ error: "Not your habit" }, { status: 403 });
    }

    if (action === "complete") {
      // Bonus XP roll: 20% chance of 3-8 bonus
      const bonusXP = Math.random() < 0.2
        ? Math.floor(Math.random() * 6) + 3
        : 0;

      const { error: insertErr } = await supabase
        .from("habit_logs")
        .insert({
          habit_id,
          user_id: user.id,
          completed_on: completedOn,
          xp_earned: habit.xp_value,
          bonus_xp: bonusXP,
        });

      if (insertErr) {
        // Likely duplicate — already completed today
        if (insertErr.code === "23505") {
          return NextResponse.json(
            { error: "Already completed today" },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: insertErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        xp_earned: habit.xp_value,
        bonus_xp: bonusXP,
      });
    }

    if (action === "uncomplete") {
      const { error: deleteErr } = await supabase
        .from("habit_logs")
        .delete()
        .eq("habit_id", habit_id)
        .eq("user_id", user.id)
        .eq("completed_on", completedOn);

      if (deleteErr) {
        return NextResponse.json(
          { error: deleteErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        xp_earned: 0,
        bonus_xp: 0,
      });
    }

    return NextResponse.json(
      { error: "Invalid action — must be 'complete' or 'uncomplete'" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Habit toggle error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
