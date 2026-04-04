"use client";

import { useRef, useEffect, useState } from "react";
import type { Database } from "@/lib/supabase/types";
import { PILLAR_COLORS } from "@/lib/pillars";

type Habit = Database["public"]["Tables"]["habits"]["Row"];

interface Props {
  habit: Habit;
  completed: boolean;
  onToggle: (id: string, el: HTMLElement) => void;
  index: number;
  bonusXP?: number;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: () => void;
}

export default function HabitCard({
  habit,
  completed,
  onToggle,
  index,
  bonusXP,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const [showBonus, setShowBonus] = useState(false);

  // Stagger load animation — only on initial mount
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    const el = cardRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(14px)";
    const delay = index * 60 + 320;
    const timer = setTimeout(() => {
      el.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, delay);
    return () => clearTimeout(timer);
  }, [index]);

  // Bonus XP badge auto-hide
  useEffect(() => {
    if (bonusXP && bonusXP > 0) {
      setShowBonus(true);
      const t = setTimeout(() => setShowBonus(false), 3000);
      return () => clearTimeout(t);
    }
  }, [bonusXP]);

  return (
    <div
      ref={cardRef}
      onClick={() => cardRef.current && onToggle(habit.id, cardRef.current)}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, habit.id)}
      onDragOver={(e) => onDragOver?.(e)}
      onDrop={(e) => onDrop?.(e, habit.id)}
      onDragEnd={onDragEnd}
      className="relative flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer select-none overflow-hidden"
      style={{
        background: "#112535",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: completed ? "scale(0.98)" : "scale(1)",
      }}
    >
      {/* Shimmer overlay */}
      {completed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(10,191,163,0.07), transparent)",
            animation: "shimmer 3s ease-in-out infinite",
          }}
        />
      )}

      {/* Bonus XP badge */}
      {showBonus && bonusXP && bonusXP > 0 && (
        <div
          className="absolute -top-1 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded z-10"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            color: "#C9A84C",
            background: "rgba(201,168,76,0.15)",
            animation: "bob 1.5s ease-in-out infinite",
          }}
        >
          +{bonusXP} BONUS
        </div>
      )}

      {/* Check circle */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
        style={{
          border: completed ? "2px solid #0ABFA3" : "2px solid rgba(255,255,255,0.15)",
          background: completed ? "#0ABFA3" : "transparent",
        }}
      >
        {completed && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7l3 3 5-6" stroke="#0A0F18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-sm transition-all duration-300"
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 500,
              opacity: completed ? 0.5 : 1,
              textDecoration: completed ? "line-through" : "none",
              color: "#fff",
            }}
          >
            {habit.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {habit.pillar_ids.map((p) => (
            <span
              key={p}
              className="text-[9px] uppercase px-1.5 py-0.5 rounded"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 600,
                color: PILLAR_COLORS[p] ?? "#fff",
                background: `${PILLAR_COLORS[p] ?? "#fff"}15`,
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Leverage pips */}
      <div className="flex gap-0.5 mr-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: i < habit.leverage_score ? "#EF0E30" : "rgba(255,255,255,0.1)",
              boxShadow: i < habit.leverage_score ? "0 0 4px rgba(239,14,48,0.4)" : "none",
            }}
          />
        ))}
      </div>

      {/* XP badge */}
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all duration-300 relative z-[1]"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          color: completed ? "#0A0F18" : "#fff",
          background: completed ? "#0ABFA3" : "rgba(239,14,48,0.15)",
        }}
      >
        {habit.xp_value} XP
      </span>
    </div>
  );
}
