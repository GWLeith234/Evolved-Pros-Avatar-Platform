"use client";

import { useState } from "react";
import type { Database } from "@/lib/supabase/types";
import { POST_TYPE_LABELS } from "@/lib/prompts";
import ScriptEditor from "@/components/ScriptEditor";
import ShortCard from "./ShortCard";
import NewShortModal from "./NewShortModal";
import VideoPostModal from "./VideoPostModal";

type Creator = Database["public"]["Tables"]["users"]["Row"];
type Episode = Database["public"]["Tables"]["episodes"]["Row"];
type Short = Database["public"]["Tables"]["shorts"]["Row"];

interface MainWorkspaceProps {
  creator: Creator;
  episode: Episode | null;
  episodeShorts: Short[];
  activeShortId: string | null;
  onSelectShort: (id: string) => void;
  onAddShort: (short: Short) => void;
  episodes: Episode[];
}

const tabs = ["All", "Episode shorts", "Video posts", "Published", "Analytics"] as const;

function filterShorts(shorts: Short[], tab: string): Short[] {
  switch (tab) {
    case "Episode shorts":
      return shorts.filter((s) => !s.post_type || s.post_type === "episode_short");
    case "Video posts":
      return shorts.filter((s) => s.post_type && s.post_type !== "episode_short");
    case "Published":
      return shorts.filter((s) => s.status === "done");
    default:
      return shorts;
  }
}

export default function MainWorkspace({
  creator,
  episode,
  episodeShorts,
  activeShortId,
  onSelectShort,
  onAddShort,
  episodes,
}: MainWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const [showNewShort, setShowNewShort] = useState(false);
  const [showVideoPost, setShowVideoPost] = useState(false);

  const activeShort = episodeShorts.find((s) => s.id === activeShortId) ?? null;
  const filteredShorts = filterShorts(episodeShorts, activeTab);

  const isVideoPost =
    activeShort?.post_type && activeShort.post_type !== "episode_short";

  // Stats
  const thisMonth = episodeShorts.filter((s) => {
    const d = new Date(s.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const published = episodeShorts.filter((s) => s.status === "done").length;
  const avgWords = episodeShorts.length
    ? Math.round(
        episodeShorts
          .filter((s) => s.script_text)
          .reduce((sum, s) => sum + (s.script_text?.split(/\s+/).length ?? 0), 0) /
          Math.max(episodeShorts.filter((s) => s.script_text).length, 1)
      )
    : 0;
  const avgDuration = avgWords ? Math.round((avgWords / 150) * 60) : 0;

  const stats = [
    { label: "Shorts this month", value: thisMonth },
    { label: "Published", value: published },
    { label: "Avg duration", value: `${avgDuration}s` },
    { label: "Time saved", value: `${episodeShorts.length * 12}m` },
  ];

  return (
    <main className="overflow-y-auto" style={{ background: "#F4F6F8" }}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-6 h-[52px] shrink-0"
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #D8DDE5",
        }}
      >
        <div className="flex-1 min-w-0">
          <span
            className="text-[14px] truncate block"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              color: "#0D1B2A",
            }}
          >
            {episode?.title ?? "Select an episode"}
          </span>
          {episode && (
            <span
              className="text-[11px]"
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                color: "#3D5A70",
              }}
            >
              {episode.podcast_name ?? creator.show_name ?? ""}{" "}
              {episode.published_at
                ? `· ${new Date(episode.published_at).toLocaleDateString()}`
                : ""}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowVideoPost(true)}
          className="text-[12px] px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#7AB3D0]/5"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 600,
            color: "#7AB3D0",
            borderColor: "#7AB3D0",
          }}
        >
          New Video Post
        </button>
        <button
          onClick={() => setShowNewShort(true)}
          className="text-[12px] px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 600,
            color: "#0D1B2A",
            borderColor: "#D8DDE5",
          }}
        >
          + Add script
        </button>
        <button
          className="text-[12px] px-4 py-1.5 rounded-lg text-white transition-colors"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 600,
            background: "#C0272D",
          }}
        >
          Generate all
        </button>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-5">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-4 py-3 border"
              style={{
                background: "#FFFFFF",
                borderColor: "#D8DDE5",
                boxShadow: "0 1px 3px rgba(0,0,0,.04)",
              }}
            >
              <span
                className="text-[10px] uppercase tracking-wider block mb-1"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 600,
                  color: "#3D5A70",
                }}
              >
                {s.label}
              </span>
              <span
                className="text-2xl"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  color: "#0D1B2A",
                }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* Script editor */}
        {activeShort && (
          <ScriptEditor
            shortId={activeShort.id}
            episodeTitle={episode?.title ?? ""}
            transcript={episode?.transcript_text ?? undefined}
            creatorId={creator.id}
            scriptText={activeShort.script_text}
            postType={activeShort.post_type ?? undefined}
            postTitle={activeShort.post_title ?? undefined}
            postBullets={activeShort.post_bullets ?? undefined}
          />
        )}

        {/* Tabs */}
        <div
          className="flex gap-0 border-b"
          style={{ borderColor: "#D8DDE5" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-[12px] transition-colors relative"
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? "#C0272D" : "#3D5A70",
              }}
            >
              {tab}
              {activeTab === tab && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: "#C0272D" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Shorts grid */}
        <div className="grid grid-cols-3 gap-4">
          {filteredShorts.map((s) => (
            <ShortCard
              key={s.id}
              short={s}
              episodeNumber={
                s.episode_id
                  ? episodes.length - episodes.findIndex((e) => e.id === s.episode_id)
                  : 0
              }
              isActive={s.id === activeShortId}
              creatorName={creator.name}
              onClick={() => onSelectShort(s.id)}
            />
          ))}
          {filteredShorts.length === 0 && (
            <div
              className="col-span-3 text-center py-12 rounded-xl border border-dashed"
              style={{ borderColor: "#D8DDE5", color: "#6B6B6B" }}
            >
              <p
                className="text-sm mb-2"
                style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}
              >
                No shorts yet
              </p>
              <p
                className="text-xs"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              >
                Click &quot;+ Add script&quot; or &quot;New Video Post&quot; to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {showNewShort && (
        <NewShortModal
          creatorId={creator.id}
          episodes={episodes}
          defaultEpisodeId={episode?.id ?? null}
          onClose={() => setShowNewShort(false)}
          onCreated={onAddShort}
        />
      )}

      {showVideoPost && (
        <VideoPostModal
          creatorId={creator.id}
          onClose={() => setShowVideoPost(false)}
          onCreated={onAddShort}
        />
      )}
    </main>
  );
}
