"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Database } from "@/lib/supabase/types";
import CompoundHero from "./CompoundHero";
import WeekBar from "./WeekBar";
import HabitCard from "./HabitCard";
import PillarHealth from "./PillarHealth";
import NudgeCard from "./NudgeCard";
import HabitEditorModal from "./HabitEditorModal";
import { PILLAR_COLORS, PILLAR_QUOTES } from "@/lib/pillars";

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

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; size: number; color: string;
}

export default function CompoundBoardClient({
  habits: initialHabits,
  todayLogs,
  weekScores,
  activeStreak,
  todayXP: initialXP,
  creatorName,
}: Props) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(todayLogs.map((l) => l.habit_id))
  );
  const [compoundXP, setCompoundXP] = useState(initialXP);
  const [bonusMap, setBonusMap] = useState<Record<string, number>>({});
  const [showEditor, setShowEditor] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | undefined>();
  const [includeWeekends, setIncludeWeekends] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("compound-board-weekend") === "true";
    }
    return false;
  });
  const [dragId, setDragId] = useState<string | null>(null);

  // Particle canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    function loop() {
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      const ps = particlesRef.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life -= p.decay;
        if (p.life <= 0) { ps.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function spawnParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.014 + Math.random() * 0.018,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  const toggleHabit = useCallback(
    async (habitId: string, el: HTMLElement) => {
      const wasCompleted = completedIds.has(habitId);
      const action = wasCompleted ? "uncomplete" : "complete";

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
          if (data.bonus_xp > 0) {
            setBonusMap((prev) => ({ ...prev, [habitId]: data.bonus_xp }));
          }
          // Fire particles from card position
          const rect = el.getBoundingClientRect();
          const habit = habits.find((h) => h.id === habitId);
          const color = PILLAR_COLORS[habit?.pillar_ids[0] ?? "execution"] ?? "#0ABFA3";
          spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, color);
        } else {
          const habit = habits.find((h) => h.id === habitId);
          setCompoundXP((prev) => Math.max(0, prev - (habit?.xp_value ?? 0)));
        }
      } catch {
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

  // Drag-to-reorder
  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    (e.target as HTMLElement).style.opacity = "0.5";
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.borderTop = "2px solid #0ABFA3";
  }
  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.borderTop = "";
    if (!dragId || dragId === targetId) return;
    const oldOrder = [...habits];
    const fromIdx = habits.findIndex((h) => h.id === dragId);
    const toIdx = habits.findIndex((h) => h.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const reordered = [...habits];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setHabits(reordered);

    fetch("/api/habits/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((h) => h.id) }),
    }).catch(() => setHabits(oldOrder));
  }
  function handleDragEnd() {
    setDragId(null);
  }

  // Editor callbacks
  function handleSaveHabit(saved: Habit) {
    setHabits((prev) => {
      const idx = prev.findIndex((h) => h.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setShowEditor(false);
    setEditHabit(undefined);
  }

  function handleDeleteHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setShowEditor(false);
    setEditHabit(undefined);
  }

  // Weekend toggle
  function toggleWeekend() {
    setIncludeWeekends((prev) => {
      const next = !prev;
      localStorage.setItem("compound-board-weekend", String(next));
      return next;
    });
  }

  // Pillar stats
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
    <main className="min-h-screen pb-12" style={{ background: "#0A0F18", color: "#fff" }}>
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[9999]"
      />

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <CompoundHero
          compoundXP={compoundXP}
          nextMilestone={nextMilestone}
          pillarQuotes={Object.values(PILLAR_QUOTES)}
        />

        <WeekBar weekScores={weekScores} includeWeekends={includeWeekends} />

        {/* Weekend toggle */}
        <div className="flex justify-end mt-1.5 mb-2">
          <button
            onClick={toggleWeekend}
            className="text-[10px] px-2.5 py-1 rounded-full transition-colors"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: includeWeekends ? "#0ABFA3" : "rgba(255,255,255,0.3)",
              background: includeWeekends ? "rgba(10,191,163,0.1)" : "rgba(255,255,255,0.04)",
            }}
          >
            Include weekends
          </button>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
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
          <button
            onClick={() => { setEditHabit(undefined); setShowEditor(true); }}
            className="text-[10px] px-2 py-1 rounded transition-colors hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.4)" }}
            title="Add / edit habits"
          >
            ✏️
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
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

        {/* Habit cards */}
        <div className="flex flex-col gap-2">
          {habits.map((habit, i) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completed={completedIds.has(habit.id)}
              onToggle={toggleHabit}
              index={i}
              bonusXP={bonusMap[habit.id]}
              draggable
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
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

      {showEditor && (
        <HabitEditorModal
          habit={editHabit}
          pillarStats={pillarStats}
          onSave={handleSaveHabit}
          onDelete={handleDeleteHabit}
          onClose={() => { setShowEditor(false); setEditHabit(undefined); }}
        />
      )}
    </main>
  );
}
