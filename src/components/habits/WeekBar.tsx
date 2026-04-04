"use client";

import type { Database } from "@/lib/supabase/types";

type DailyScore = Database["public"]["Tables"]["daily_scores"]["Row"];

interface Props {
  weekScores: DailyScore[];
  threshold?: number;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeekBar({ weekScores, threshold = 0.7 }: Props) {
  const today = new Date();
  const todayDay = today.getDay(); // 0=Sun
  const todayIdx = todayDay === 0 ? 6 : todayDay - 1; // 0=Mon

  // Build a map of day index → score
  const scoreMap = new Map<number, DailyScore>();
  for (const s of weekScores) {
    const d = new Date(s.score_date + "T12:00:00");
    const dayOfWeek = d.getDay();
    const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    scoreMap.set(idx, s);
  }

  return (
    <div className="flex justify-between gap-1 mt-2">
      {DAYS.map((label, i) => {
        const score = scoreMap.get(i);
        const isToday = i === todayIdx;
        const isFuture = i > todayIdx;
        const isWeekend = i >= 5;
        const hit =
          score && score.habits_total > 0
            ? score.habits_done / score.habits_total >= threshold
            : false;

        return (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 flex-1"
            style={{ opacity: isFuture ? 0.4 : isWeekend && !isToday ? 0.6 : 1 }}
          >
            <span
              className="text-[10px] uppercase"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                color: isToday ? "#0ABFA3" : "rgba(255,255,255,0.35)",
              }}
            >
              {label}
            </span>
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: hit ? "#EF0E30" : "rgba(255,255,255,0.08)",
                boxShadow: hit ? "0 0 8px rgba(239,14,48,0.5)" : "none",
                border: isToday ? "2px solid #0ABFA3" : "2px solid transparent",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
