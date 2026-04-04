"use client";

import { useEffect } from "react";

interface Props {
  type: "day_complete" | "streak" | "xp_milestone";
  value: number;
  todayXP: number;
  onDismiss: () => void;
  onSpawnParticles?: (x: number, y: number, color: string) => void;
}

const PILLAR_COLORS_ARRAY = ["#FFA538", "#A78BFA", "#F87171", "#60A5FA", "#C9A84C", "#0ABFA3"];

const XP_MILESTONES = [500, 1000, 2500, 5000, 10000, 25000, 50000];

function getMessages(type: string, value: number, todayXP: number) {
  if (type === "day_complete") {
    return {
      emoji: "✅",
      headline: "Full send.",
      body: "Every box checked. That's the standard.",
      detail: `+${todayXP} XP`,
    };
  }
  if (type === "streak") {
    if (value <= 7) return { emoji: "🔥", headline: "One week.", body: "The compound curve just started bending.", detail: `${value}-day streak` };
    if (value <= 30) return { emoji: "🔥", headline: `${value} days.`, body: "You've outrun 95% of people who started.", detail: "Keep compounding" };
    return { emoji: "🔥", headline: `${value} days.`, body: "The gap between you and where you started is permanent.", detail: "Unstoppable" };
  }
  // xp_milestone
  const next = XP_MILESTONES.find((m) => m > value) ?? value * 2;
  return {
    emoji: "⚡",
    headline: `${value.toLocaleString()} XP`,
    body: `Another milestone locked. Next: ${next.toLocaleString()}.`,
    detail: "Compounding",
  };
}

export default function CelebrationOverlay({ type, value, todayXP, onDismiss, onSpawnParticles }: Props) {
  useEffect(() => {
    // Fire particles across screen
    if (onSpawnParticles) {
      for (let i = 0; i < 6; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.2;
        onSpawnParticles(x, y, PILLAR_COLORS_ARRAY[i]);
      }
    }

    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss, onSpawnParticles]);

  const msg = getMessages(type, value, todayXP);

  return (
    <div
      className="fixed inset-0 z-[10000]"
      style={{ background: "rgba(10,15,24,0.85)", backdropFilter: "blur(10px)" }}
      onClick={onDismiss}
    >
      <div
        style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div className="text-center px-6 max-w-sm">
          <div
            className="text-5xl mb-4"
            style={{ animation: "bob 0.8s ease-in-out infinite" }}
          >
            {msg.emoji}
          </div>
          <h2
            className="text-3xl mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#fff" }}
          >
            {msg.headline}
          </h2>
          <p
            className="text-base mb-3"
            style={{ fontFamily: "'Barlow', sans-serif", color: "rgba(255,255,255,0.6)" }}
          >
            {msg.body}
          </p>
          <span
            className="text-xs uppercase tracking-widest"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              color: "#0ABFA3",
            }}
          >
            {msg.detail}
          </span>
        </div>
      </div>
    </div>
  );
}
