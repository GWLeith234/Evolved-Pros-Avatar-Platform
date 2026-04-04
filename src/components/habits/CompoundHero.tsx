"use client";

import { useState, useEffect } from "react";

interface ScorePoint {
  score_date: string;
  total_xp: number;
}

interface Props {
  compoundXP: number;
  nextMilestone: number;
  pillarQuotes: string[];
}

export default function CompoundHero({ compoundXP, nextMilestone, pillarQuotes }: Props) {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [scores, setScores] = useState<ScorePoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Rotating quotes
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

  // Fetch lifetime scores for curve
  useEffect(() => {
    fetch("/api/habits/scores/lifetime")
      .then((r) => r.json())
      .then((data) => {
        setScores(data.scores ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Build SVG curve
  const W = 200;
  const H = 50;
  let curvePath = "";
  let lastPoint = { x: 0, y: H };

  if (scores.length >= 3) {
    const cumulative: number[] = [];
    let sum = 0;
    for (const s of scores) {
      sum += s.total_xp;
      cumulative.push(sum);
    }
    const maxCum = Math.max(...cumulative, 1);
    const n = cumulative.length;

    const points = cumulative.map((c, i) => ({
      x: (i / (n - 1)) * W,
      y: H - (c / maxCum) * (H - 10),
    }));

    curvePath = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) * 0.33;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - (points[i].x - points[i - 1].x) * 0.33;
      const cp2y = points[i].y;
      curvePath += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`;
    }
    lastPoint = points[points.length - 1];
  }

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

      {/* Compound curve */}
      <div className="w-full max-w-xs mx-auto mb-4 relative" style={{ height: 60 }}>
        {loading ? null : scores.length < 3 ? (
          <p
            className="text-xs absolute inset-0 flex items-center justify-center"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "rgba(255,255,255,0.3)" }}
          >
            Your curve starts today.
          </p>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
            <defs>
              <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0ABFA3" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#EF0E30" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Fill area */}
            <path
              d={`${curvePath} L${W},${H} L0,${H} Z`}
              fill="url(#curveGrad)"
            />
            {/* Stroke */}
            <path d={curvePath} fill="none" stroke="#EF0E30" strokeWidth="1.5" />
            {/* Pulsing dot at last point */}
            <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill="#EF0E30">
              <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Day label */}
            <text
              x={Math.min(lastPoint.x, W - 30)}
              y={lastPoint.y - 6}
              fill="rgba(255,255,255,0.5)"
              fontSize="5"
              fontFamily="'Barlow Condensed', sans-serif"
              textAnchor="end"
            >
              DAY {scores.length}
            </text>
          </svg>
        )}
      </div>

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
