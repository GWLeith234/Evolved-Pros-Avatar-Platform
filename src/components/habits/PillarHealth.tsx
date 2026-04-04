"use client";

import { PILLAR_COLORS } from "@/lib/pillars";

interface Props {
  pillarStats: Record<string, { pct: number; trend: "up" | "down" | "flat" }>;
}

const trendArrows: Record<string, string> = {
  up: "↑",
  down: "↓",
  flat: "→",
};

export default function PillarHealth({ pillarStats }: Props) {
  const pillars = Object.entries(pillarStats);

  return (
    <div className="mt-6">
      <h2
        className="text-xs uppercase tracking-widest mb-3"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        Pillar Health
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {pillars.map(([pillar, { pct, trend }]) => {
          const color = PILLAR_COLORS[pillar] ?? "#fff";
          const needsAttention = pct < 50;

          return (
            <div
              key={pillar}
              className="px-3 py-2.5 rounded-lg"
              style={{
                background: "#112535",
                border: needsAttention
                  ? `1px solid ${color}40`
                  : "1px solid rgba(255,255,255,0.06)",
                animation: needsAttention ? "pulse 3s infinite" : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[10px] uppercase tracking-wider"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    color,
                  }}
                >
                  {pillar}
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className="text-[10px]"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {pct}%
                  </span>
                  <span
                    className="text-[9px]"
                    style={{
                      color:
                        trend === "up" ? "#0ABFA3" : trend === "down" ? "#EF0E30" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {trendArrows[trend]}
                  </span>
                </div>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              {pct === 0 && (
                <span
                  className="text-[8px] mt-1 block"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  building baseline...
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
