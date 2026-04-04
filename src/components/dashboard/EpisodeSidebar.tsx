"use client";

import Link from "next/link";
import type { Database } from "@/lib/supabase/types";

type Episode = Database["public"]["Tables"]["episodes"]["Row"];
type Short = Database["public"]["Tables"]["shorts"]["Row"];

interface EpisodeSidebarProps {
  episodes: Episode[];
  shorts: Short[];
  activeEpisodeId: string | null;
  onSelectEpisode: (id: string) => void;
}

const navItems = [
  { label: "Dashboard", icon: "▣", active: true },
  { label: "New Short", icon: "+", badge: true },
  { label: "All Shorts", icon: "◫" },
  { label: "Schedule", icon: "◷" },
  { label: "Compound Board", icon: "📈", href: "/habits" },
];

function getEpisodeStatus(episodeId: string, shorts: Short[]) {
  const epShorts = shorts.filter((s) => s.episode_id === episodeId);
  if (epShorts.length === 0) return "draft";
  if (epShorts.some((s) => ["voice_rendering", "avatar_generating", "compositing", "queued"].includes(s.status)))
    return "processing";
  if (epShorts.every((s) => s.status === "done")) return "done";
  return "draft";
}

export default function EpisodeSidebar({
  episodes,
  shorts,
  activeEpisodeId,
  onSelectEpisode,
}: EpisodeSidebarProps) {
  return (
    <aside
      className="overflow-y-auto flex flex-col"
      style={{
        background: "#1A2E42",
        borderRight: "1px solid rgba(122,179,208,.08)",
      }}
    >
      {/* Nav section */}
      <div className="px-3 pt-4 pb-2">
        <span
          className="text-[9px] uppercase tracking-widest px-2.5 mb-2 block"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            color: "#7AB3D0",
          }}
        >
          Studio
        </span>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const cls = "flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-left transition-colors hover:bg-white/5";
            const style = {
              borderLeft: item.active ? "3px solid #C0272D" : "3px solid transparent",
              color: item.active ? "#C0272D" : "rgba(255,255,255,.6)",
            };
            const content = (
              <>
                <span className="text-sm w-4 text-center">{item.icon}</span>
                <span className="text-[13px]" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    className="ml-auto text-[9px] px-1.5 py-0.5 rounded text-white"
                    style={{ background: "#C0272D", fontFamily: "Montserrat, sans-serif", fontWeight: 700 }}
                  >
                    +
                  </span>
                )}
              </>
            );

            if (item.href) {
              return (
                <Link key={item.label} href={item.href} className={cls} style={style}>
                  {content}
                </Link>
              );
            }

            return (
              <button key={item.label} className={cls} style={style}>
                {content}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Divider */}
      <div className="mx-3 my-2 border-t" style={{ borderColor: "rgba(122,179,208,.1)" }} />

      {/* Episodes section */}
      <div className="px-3 pb-4 flex-1">
        <span
          className="text-[9px] uppercase tracking-widest px-2.5 mb-2 block"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            color: "#7AB3D0",
          }}
        >
          Episodes
        </span>
        <div className="flex flex-col gap-1">
          {episodes.map((ep, i) => {
            const status = getEpisodeStatus(ep.id, shorts);
            const isActive = ep.id === activeEpisodeId;
            return (
              <button
                key={ep.id}
                onClick={() => onSelectEpisode(ep.id)}
                className="text-left px-2.5 py-2.5 rounded-lg transition-colors"
                style={{
                  background: isActive ? "rgba(122,179,208,.1)" : "transparent",
                  border: isActive
                    ? "1px solid rgba(122,179,208,.15)"
                    : "1px solid transparent",
                }}
              >
                <span
                  className="text-[9px] block mb-0.5"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontWeight: 700,
                    color: "#7AB3D0",
                  }}
                >
                  EP {episodes.length - i}
                </span>
                <span
                  className="text-[12px] block truncate"
                  style={{
                    fontFamily: "'Roboto Condensed', sans-serif",
                    color: "rgba(255,255,255,.8)",
                  }}
                >
                  {ep.title}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background:
                        status === "done"
                          ? "#1a8a4a"
                          : status === "processing"
                            ? "#7AB3D0"
                            : "#6B6B6B",
                      animation:
                        status === "processing"
                          ? "pulse 2s infinite"
                          : undefined,
                    }}
                  />
                  <span
                    className="text-[10px] capitalize"
                    style={{ color: "#6B6B6B" }}
                  >
                    {status}
                  </span>
                </div>
              </button>
            );
          })}
          {episodes.length === 0 && (
            <p
              className="text-[11px] px-2.5 py-4"
              style={{ color: "#6B6B6B" }}
            >
              No episodes yet
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
