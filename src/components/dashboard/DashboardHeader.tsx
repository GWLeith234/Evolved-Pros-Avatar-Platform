"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/supabase/types";

type Creator = Database["public"]["Tables"]["creators"]["Row"];

interface DashboardHeaderProps {
  creator: Creator;
  creators: Creator[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardHeader({
  creator,
  creators,
}: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header
      className="flex items-center px-4 h-[60px]"
      style={{
        background: "#0D1B2A",
        borderBottom: "1px solid rgba(122,179,208,.12)",
      }}
    >
      {/* Left — logo */}
      <div className="flex items-center gap-2.5 w-[260px] shrink-0">
        <div
          className="flex items-center justify-center rounded-md"
          style={{
            width: 34,
            height: 34,
            background: "#C0272D",
          }}
        >
          <span
            className="text-white text-sm tracking-wide"
            style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800 }}
          >
            EP
          </span>
        </div>
        <div className="flex flex-col leading-none">
          <span
            className="text-white text-xs"
            style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700 }}
          >
            Evolved Pros
          </span>
          <span
            className="text-[10px] uppercase tracking-wider"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 500,
              color: "#7AB3D0",
            }}
          >
            AI Avatar Platform
          </span>
        </div>
      </div>

      {/* Center — creator switcher */}
      <div className="flex-1 flex justify-center">
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px]"
              style={{
                background: "#C0272D",
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
              }}
            >
              {getInitials(creator.name)}
            </div>
            <div className="flex flex-col items-start leading-none">
              <span
                className="text-white text-[13px]"
                style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}
              >
                {creator.name}
              </span>
              {creator.show_name && (
                <span className="text-[10px]" style={{ color: "#7AB3D0" }}>
                  {creator.show_name}
                </span>
              )}
            </div>
            <span className="text-white/40 text-xs ml-1">▾</span>
          </button>

          {open && (
            <div
              className="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-56 rounded-lg shadow-xl border z-50 py-1"
              style={{
                background: "#1A2E42",
                borderColor: "rgba(122,179,208,.15)",
              }}
            >
              {creators.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setOpen(false);
                    if (c.id !== creator.id) {
                      router.push(`/dashboard?creator=${c.id}`);
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px]"
                    style={{
                      background: c.id === creator.id ? "#C0272D" : "#3D5A70",
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(c.name)}
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-white text-xs">{c.name}</span>
                    {c.show_name && (
                      <span className="text-[9px]" style={{ color: "#7AB3D0" }}>
                        {c.show_name}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right — status pills + avatar */}
      <div className="flex items-center gap-3">
        {["ElevenLabs", "HeyGen", "Remotion"].map((svc) => (
          <div
            key={svc}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px]"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 600,
              color: "#7AB3D0",
              background: "rgba(122,179,208,.08)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {svc}
          </div>
        ))}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] ml-2"
          style={{
            background: "#C0272D",
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
          }}
        >
          {getInitials(creator.name)}
        </div>
      </div>
    </header>
  );
}
