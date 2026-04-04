"use client";

import type { Database } from "@/lib/supabase/types";

type Habit = Database["public"]["Tables"]["habits"]["Row"];

interface Props {
  habits: Habit[];
  completedIds: Set<string>;
  streakCount: number;
  compoundXP: number;
  nextMilestone: number;
}

export default function ReturnBar({
  habits,
  completedIds,
  streakCount,
  compoundXP,
  nextMilestone,
}: Props) {
  const allDone = completedIds.size >= habits.length && habits.length > 0;
  const remaining = habits.length - completedIds.size;
  const xpToMilestone = nextMilestone - compoundXP;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center pointer-events-none"
    >
      <div
        className="w-full max-w-[540px] mx-4 mb-4 px-4 py-2.5 rounded-xl flex items-center justify-between pointer-events-auto"
        style={{
          background: "linear-gradient(135deg, #112535 0%, #1B3C5A 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <span
          className="text-[11px]"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          {allDone
            ? `Tomorrow: ${habits.length} habits · streak at ${streakCount + 1}`
            : `${remaining} habit${remaining !== 1 ? "s" : ""} left today · ${xpToMilestone} XP to milestone`}
        </span>
        <span
          className="text-[11px]"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            color: streakCount > 0 ? "#EF0E30" : "rgba(255,255,255,0.4)",
            animation: streakCount > 0 ? "pulse 2s infinite" : undefined,
          }}
        >
          {streakCount > 0 ? "🔥 Keep it alive" : "Start your streak today"}
        </span>
      </div>
    </div>
  );
}
