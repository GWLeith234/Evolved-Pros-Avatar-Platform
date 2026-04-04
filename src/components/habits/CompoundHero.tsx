"use client";

import { useState, useEffect } from "react";

interface Props {
  compoundXP: number;
  nextMilestone: number;
  pillarQuotes: string[];
}

export default function CompoundHero({ compoundXP, nextMilestone, pillarQuotes }: Props) {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (pillarQuotes.length <= 1) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIdx((i) => (i + 1) % pillarQuotes.length);
        setFade(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, [pillarQuotes.length]);

  return (
    <div className="text-center py-6">
      {/* XP number */}
      <div
        className="text-6xl font-bold mb-1"
        style={{
          fontFamily: "'Playfair Display', serif",
          background: "linear-gradient(180deg, #F5F0E8 0%, #EF0E30 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {compoundXP}
      </div>
      <div
        className="text-xs uppercase tracking-widest mb-4"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        Compound XP · next milestone {nextMilestone}
      </div>

      {/* Exponential curve placeholder */}
      <svg
        viewBox="0 0 200 40"
        className="w-full max-w-xs mx-auto mb-4"
        style={{ opacity: 0.3 }}
      >
        <path
          d="M0,38 Q50,36 100,30 T200,2"
          fill="none"
          stroke="#EF0E30"
          strokeWidth="1.5"
        />
      </svg>

      {/* Rotating quote */}
      <p
        className="text-sm italic mx-auto max-w-sm transition-opacity duration-400"
        style={{
          fontFamily: "'Playfair Display', serif",
          color: "rgba(255,255,255,0.5)",
          opacity: fade ? 1 : 0,
        }}
      >
        &ldquo;{pillarQuotes[quoteIdx]}&rdquo;
      </p>
    </div>
  );
}
