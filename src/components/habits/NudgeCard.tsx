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
  if (completedIds.size >= habits.length && habits.length > 0) return null;

  const incomplete = habits.filter((h) => !completedIds.has(h.id));
  if (incomplete.length === 0) return null;

  // Score: leverage + 2 bonus if any tagged pillar < 50%
  const ranked = [...incomplete].sort((a, b) => {
    const aBonus = a.pillar_ids.some((p) => (pillarStats[p]?.pct ?? 0) < 50) ? 2 : 0;
    const bBonus = b.pillar_ids.some((p) => (pillarStats[p]?.pct ?? 0) < 50) ? 2 : 0;
    return (b.leverage_score + bBonus) - (a.leverage_score + aBonus);
  });

  const nudge = ranked[0];
  // Find weakest tagged pillar
  const weakest = [...nudge.pillar_ids].sort(
    (a, b) => (pillarStats[a]?.pct ?? 0) - (pillarStats[b]?.pct ?? 0)
  )[0];
  const color = PILLAR_COLORS[weakest ?? nudge.pillar_ids[0]] ?? "#EF0E30";

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
          {weakest && (
            <span style={{ color: "rgba(255,255,255,0.4)" }}>
              {" "}
              — would lift your {weakest} pillar
            </span>
          )}
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
