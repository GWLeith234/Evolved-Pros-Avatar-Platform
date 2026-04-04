"use client";

import { useState, useCallback } from "react";
import type { Database } from "@/lib/supabase/types";
import CompoundHero from "./CompoundHero";
import WeekBar from "./WeekBar";
import HabitCard from "./HabitCard";
import PillarHealth from "./PillarHealth";
import NudgeCard from "./NudgeCard";
import { PILLAR_QUOTES } from "@/lib/pillars";

type Habit = Database["public"]["Tables"]["habits"]["Row"];
type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"];
type DailyScore = Database["public"]["Tables"]["daily_scores"]["Row"];
type StreakRecord = Database["public"]["Tables"]["streak_records"]["Row"];

interface Props {
  habits: Habit[];
  todayLogs: HabitLog[];
  weekScores: DailyScore[];
  activeStreak: StreakRecord | null;
  todayXP: number;
  creatorName: string;
}

export default function CompoundBoardClient({
  habits,
  todayLogs,
  weekScores,
  activeStreak,
  todayXP: initialXP,
  creatorName,
}: Props) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(todayLogs.map((l) => l.habit_id))
  );
  const [compoundXP, setCompoundXP] = useState(initialXP);

  const toggleHabit = useCallback(
    async (habitId: string) => {
      const wasCompleted = completedIds.has(habitId);
      const action = wasCompleted ? "uncomplete" : "complete";

      // Optimistic update
      setCompletedIds((prev) => {
        const next = new Set(prev);
        if (wasCompleted) next.delete(habitId);
        else next.add(habitId);
        return next;
      });

      try {
        const res = await fetch("/api/habits/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habit_id: habitId, action }),
        });

        if (!res.ok) throw new Error("Toggle failed");

        const data = await res.json();
        if (action === "complete") {
          setCompoundXP((prev) => prev + (data.xp_earned ?? 0) + (data.bonus_xp ?? 0));
        } else {
          const habit = habits.find((h) => h.id === habitId);
          setCompoundXP((prev) => Math.max(0, prev - (habit?.xp_value ?? 0)));
        }
      } catch {
        // Revert on error
        setCompletedIds((prev) => {
          const reverted = new Set(prev);
          if (wasCompleted) reverted.add(habitId);
          else reverted.delete(habitId);
          return reverted;
        });
      }
    },
    [completedIds, habits]
  );

  // Calculate pillar stats from today's completions
  const pillarStats: Record<string, { pct: number; trend: "up" | "down" | "flat" }> = {};
  const allPillars = ["foundation", "identity", "mental", "strategy", "accountability", "execution"];
  for (const p of allPillars) {
    const tagged = habits.filter((h) => h.pillar_ids.includes(p));
    const done = tagged.filter((h) => completedIds.has(h.id)).length;
    pillarStats[p] = {
      pct: tagged.length ? Math.round((done / tagged.length) * 100) : 0,
      trend: "flat",
    };
  }

  const nextMilestone = Math.ceil((compoundXP + 1) / 100) * 100;
  const doneCount = completedIds.size;
  const totalCount = habits.length;

  return (
    <main
      className="min-h-screen pb-12"
      style={{ background: "#0A0F18", color: "#fff" }}
    >
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <CompoundHero
          compoundXP={compoundXP}
          nextMilestone={nextMilestone}
          pillarQuotes={Object.values(PILLAR_QUOTES)}
        />

        <WeekBar weekScores={weekScores} />

        {/* Progress section */}
        <div className="mt-6 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2
              className="text-xs uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "rgba(255,255,255,0.5)" }}
            >
              Today&apos;s Habits
            </h2>
            <span
              className="text-xs"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#0ABFA3" }}
            >
              {doneCount}/{totalCount}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: totalCount ? `${(doneCount / totalCount) * 100}%` : "0%",
                background: doneCount === totalCount && totalCount > 0
                  ? "linear-gradient(90deg, #0ABFA3, #60A5FA)"
                  : "#EF0E30",
              }}
            />
          </div>
        </div>

        {/* Habit cards */}
        <div className="flex flex-col gap-2">
          {habits.map((habit, i) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completed={completedIds.has(habit.id)}
              onToggle={toggleHabit}
              index={i}
            />
          ))}
        </div>

        <PillarHealth pillarStats={pillarStats} />

        <NudgeCard
          habits={habits}
          completedIds={completedIds}
          pillarStats={pillarStats}
        />

        {/* Streak */}
        {activeStreak && activeStreak.streak_length > 1 && (
          <div
            className="mt-4 text-center text-xs py-2 rounded-lg"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              background: "rgba(239,14,48,0.08)",
              color: "#EF0E30",
            }}
          >
            🔥 {activeStreak.streak_length}-day streak
            {activeStreak.is_personal_best && " — Personal best!"}
          </div>
        )}
      </div>
    </main>
  );
}
