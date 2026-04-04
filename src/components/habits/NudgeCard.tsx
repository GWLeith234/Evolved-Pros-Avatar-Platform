"use client";

import type { Database } from "@/lib/supabase/types";
import { PILLAR_COLORS } from "@/lib/pillars";

type Habit = Database["public"]["Tables"]["habits"]["Row"];

interface Props {
  habits: Habit[];
  completedIds: Set<string>;
  pillarStats: Record<string, { pct: number; trend: "up" | "down" | "flat" }>;
}

export default function NudgeCard({ habits, completedIds, pillarStats }: Props) {
  // Hide if all done
  const incomplete = habits.filter((h) => !completedIds.has(h.id));
  if (incomplete.length === 0) return null;

  // Find highest leverage incomplete, tiebreak by weakest pillar
  const ranked = [...incomplete].sort((a, b) => {
    if (b.leverage_score !== a.leverage_score) return b.leverage_score - a.leverage_score;
    // Weakest pillar tiebreak
    const aMin = Math.min(...a.pillar_ids.map((p) => pillarStats[p]?.pct ?? 0));
    const bMin = Math.min(...b.pillar_ids.map((p) => pillarStats[p]?.pct ?? 0));
    return aMin - bMin; // lower pillar pct = higher priority
  });

  const nudge = ranked[0];
  const nudgePillar = nudge.pillar_ids[0];
  const color = PILLAR_COLORS[nudgePillar] ?? "#EF0E30";

  return (
    <div
      className="mt-4 px-4 py-3 rounded-xl flex items-center gap-3"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}25`,
      }}
    >
      <span className="text-lg">⚡</span>
      <div className="flex-1">
        <span
          className="text-xs block"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Highest impact move right now
        </span>
        <span
          className="text-sm"
          style={{ fontFamily: "'Barlow', sans-serif", color: "#fff" }}
        >
          {nudge.title}
        </span>
      </div>
      <span
        className="text-[10px] uppercase px-2 py-0.5 rounded"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 600,
          color,
          background: `${color}20`,
        }}
      >
        {nudge.leverage_score}× leverage
      </span>
    </div>
  );
}
