"use client";

import { useState } from "react";
import type { Database } from "@/lib/supabase/types";
import { POST_TYPE_LABELS } from "@/lib/prompts";

type Short = Database["public"]["Tables"]["shorts"]["Row"];

interface ShortCardProps {
  short: Short;
  episodeNumber: number;
  isActive: boolean;
  creatorName: string;
  onClick: () => void;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; barWidth: string; barColor: string; animate?: boolean }
> = {
  done: { label: "Ready", color: "#1a8a4a", bg: "#e8f7ee", barWidth: "100%", barColor: "#1a8a4a" },
  compositing: { label: "Processing", color: "#0e7a9a", bg: "#e3f4fa", barWidth: "75%", barColor: "#7AB3D0", animate: true },
  avatar_generating: { label: "Generating", color: "#0e7a9a", bg: "#e3f4fa", barWidth: "50%", barColor: "#7AB3D0", animate: true },
  voice_rendering: { label: "Voice", color: "#0e7a9a", bg: "#e3f4fa", barWidth: "30%", barColor: "#7AB3D0", animate: true },
  queued: { label: "Queued", color: "#6B6B6B", bg: "#EEF1F5", barWidth: "25%", barColor: "#6B6B6B" },
  draft: { label: "Draft", color: "#6B6B6B", bg: "#EEF1F5", barWidth: "10%", barColor: "#D8DDE5" },
  error: { label: "Error", color: "#C0272D", bg: "#fdecea", barWidth: "100%", barColor: "#C0272D" },
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function ShortCard({
  short,
  episodeNumber,
  isActive,
  creatorName,
  onClick,
}: ShortCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const cfg = statusConfig[short.status] ?? statusConfig.draft;
  const isVideoPost = short.post_type && short.post_type !== "episode_short";

  const wordCount = short.script_text
    ? short.script_text.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const duration = wordCount ? Math.round((wordCount / 150) * 60) : 0;

  return (
    <>
      <div
        onClick={onClick}
        className="rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5"
        style={{
          background: "#FFFFFF",
          borderColor: isActive ? "#C0272D" : "#D8DDE5",
          boxShadow: isActive
            ? "0 0 0 2px rgba(192,39,45,.15), 0 2px 8px rgba(0,0,0,.06)"
            : "0 1px 3px rgba(0,0,0,.04)",
        }}
      >
        {/* Thumbnail */}
        <div
          className="relative overflow-hidden rounded-t-xl"
          style={{ aspectRatio: "9/16", background: "#0D1B2A", maxHeight: 220 }}
        >
          {short.mux_playback_id ? (
            <img
              src={`https://image.mux.com/${short.mux_playback_id}/thumbnail.jpg`}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
                style={{
                  background: "#1A2E42",
                  color: "#7AB3D0",
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                }}
              >
                {getInitials(creatorName)}
              </div>
              <span className="text-[10px]" style={{ color: "#3D5A70" }}>
                {cfg.label}
              </span>
            </div>
          )}

          {/* Badge: post type or episode number */}
          {isVideoPost ? (
            <span
              className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] text-white"
              style={{
                background: "#7AB3D0",
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
              }}
            >
              {POST_TYPE_LABELS[short.post_type!] ?? short.post_type}
            </span>
          ) : (
            <span
              className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] text-white"
              style={{
                background: "#C0272D",
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
              }}
            >
              EP {episodeNumber}
            </span>
          )}

          {/* Progress bar */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px]"
            style={{ background: "rgba(255,255,255,.1)" }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: cfg.barWidth,
                background: cfg.barColor,
                animation: cfg.animate ? "pulse 2s infinite" : undefined,
              }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="px-3.5 py-3">
          <span
            className="text-[9px] uppercase block mb-1"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              color: "#6B6B6B",
            }}
          >
            Short
          </span>
          <p
            className="text-[12px] truncate mb-2"
            style={{
              fontFamily: "'Roboto Condensed', sans-serif",
              color: "#0D1B2A",
            }}
          >
            {isVideoPost
              ? short.post_title || short.script_text?.slice(0, 60) || "No title"
              : short.script_text?.slice(0, 60) || "No script yet"}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 600,
                color: cfg.color,
                background: cfg.bg,
              }}
            >
              {cfg.label}
            </span>
            {duration > 0 && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 600,
                  color: "#0e7a9a",
                  background: "#e3f4fa",
                }}
              >
                ~{duration}s
              </span>
            )}
            {short.status === "done" && short.mux_playback_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(true);
                }}
                className="text-[10px] px-2 py-0.5 rounded-full border transition-colors hover:bg-gray-50"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 600,
                  color: "#7AB3D0",
                  borderColor: "#D8DDE5",
                }}
              >
                Preview
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && short.mux_playback_id && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#0D1B2A" }}
          >
            <div className="p-2 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="text-white/60 hover:text-white text-sm px-2"
              >
                ✕
              </button>
            </div>
            <mux-player
              playback-id={short.mux_playback_id}
              style={{ aspectRatio: "9/16", height: 400, display: "block" }}
            />
          </div>
        </div>
      )}
    </>
  );
}
