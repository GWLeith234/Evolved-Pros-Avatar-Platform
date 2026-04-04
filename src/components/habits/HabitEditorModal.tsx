"use client";

import { useState, useEffect } from "react";
import type { Database } from "@/lib/supabase/types";
import { PILLAR_COLORS } from "@/lib/pillars";

type Habit = Database["public"]["Tables"]["habits"]["Row"];

const ALL_PILLARS = ["foundation", "identity", "mental", "strategy", "accountability", "execution"];

interface Props {
  habit?: Habit;
  pillarStats: Record<string, { pct: number; trend: string }>;
  onSave: (habit: Habit) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export default function HabitEditorModal({ habit, pillarStats, onSave, onDelete, onClose }: Props) {
  const isEdit = !!habit;
  const [title, setTitle] = useState(habit?.title ?? "");
  const [pillarIds, setPillarIds] = useState<string[]>(habit?.pillar_ids ?? []);
  const [xpValue, setXpValue] = useState(habit?.xp_value ?? 10);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Auto-calculate leverage score
  const hasWeakPillar = pillarIds.some((p) => (pillarStats[p]?.pct ?? 0) < 50);
  const leverageScore = Math.min(5, pillarIds.length + (hasWeakPillar ? 2 : 0));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function togglePillar(p: string) {
    setPillarIds((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      if (prev.length >= 2) return prev;
      return [...prev, p];
    });
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const body = { title: title.trim(), pillar_ids: pillarIds, xp_value: xpValue, leverage_score: leverageScore };
      const url = isEdit ? `/api/habits/${habit.id}` : "/api/habits";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      const saved = await res.json();
      onSave(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!habit || !onDelete) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/habits/${habit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });

      if (!res.ok) throw new Error("Delete failed");
      onDelete(habit.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="rounded-xl w-full max-w-sm mx-4 p-5"
        style={{
          background: "#112535",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-base mb-4"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, color: "#fff" }}
        >
          {isEdit ? "Edit Habit" : "New Habit"}
        </h3>

        {/* Title */}
        <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>
          Habit name ({title.length}/60)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 60))}
          className="w-full rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#0ABFA3]"
          style={{ background: "#0A0F18", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", fontFamily: "'Barlow', sans-serif" }}
          autoFocus
        />

        {/* Pillar tags */}
        <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>
          Pillars (1–2)
        </label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {ALL_PILLARS.map((p) => {
            const selected = pillarIds.includes(p);
            const color = PILLAR_COLORS[p];
            return (
              <button
                key={p}
                onClick={() => togglePillar(p)}
                className="text-[10px] uppercase px-2.5 py-1 rounded-md transition-all"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  color: selected ? "#0A0F18" : color,
                  background: selected ? color : `${color}15`,
                  border: `1px solid ${selected ? color : "transparent"}`,
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* XP slider */}
        <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>
          XP Value: {xpValue}
        </label>
        <input
          type="range"
          min={5}
          max={25}
          value={xpValue}
          onChange={(e) => setXpValue(Number(e.target.value))}
          className="w-full mb-3 accent-[#EF0E30]"
        />

        {/* Leverage preview */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>
            Leverage:
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: i < leverageScore ? "#EF0E30" : "rgba(255,255,255,0.1)",
                  boxShadow: i < leverageScore ? "0 0 4px rgba(239,14,48,0.4)" : "none",
                }}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="text-[11px] text-[#EF0E30] mb-2">{error}</p>
        )}

        <div className="flex gap-2">
          {isEdit && onDelete && (
            confirmDelete ? (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-3 py-2 rounded-lg text-[11px] transition-colors disabled:opacity-50"
                style={{ background: "rgba(239,14,48,0.15)", color: "#EF0E30", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}
              >
                Confirm delete
              </button>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 rounded-lg text-[11px] transition-colors"
                style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Delete
              </button>
            )
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[11px] transition-colors"
            style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-[11px] text-white transition-colors disabled:opacity-50"
            style={{ background: "#0ABFA3", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}
          >
            {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
