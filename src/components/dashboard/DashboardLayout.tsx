"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import DashboardHeader from "./DashboardHeader";
import EpisodeSidebar from "./EpisodeSidebar";
import MainWorkspace from "./MainWorkspace";
import PipelinePanel from "./PipelinePanel";

type Creator = Database["public"]["Tables"]["users"]["Row"];
type Episode = Database["public"]["Tables"]["episodes"]["Row"];
type Short = Database["public"]["Tables"]["shorts"]["Row"];

interface DashboardLayoutProps {
  creator: Creator;
  creators: Creator[];
  episodes: Episode[];
  shorts: Short[];
}

export default function DashboardLayout({
  creator,
  creators,
  episodes,
  shorts: initialShorts,
}: DashboardLayoutProps) {
  const [shorts, setShorts] = useState<Short[]>(initialShorts);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(
    episodes[0]?.id ?? null
  );
  const [activeShortId, setActiveShortId] = useState<string | null>(null);

  const activeShort = shorts.find((s) => s.id === activeShortId) ?? null;
  const activeEpisode = episodes.find((e) => e.id === activeEpisodeId) ?? null;
  const episodeShorts = shorts.filter(
    (s) => s.episode_id === activeEpisodeId || !s.episode_id
  );

  const updateShortInState = useCallback(
    (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      const updated = payload.new as Short;
      setShorts((prev) => {
        const idx = prev.findIndex((s) => s.id === updated.id);
        if (payload.eventType === "DELETE") {
          return prev.filter((s) => s.id !== (payload.old as Short).id);
        }
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    },
    []
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("shorts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shorts",
          filter: `creator_id=eq.${creator.id}`,
        },
        (payload) => updateShortInState(payload as never)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [creator.id, updateShortInState]);

  function addShort(newShort: Short) {
    setShorts((prev) => [newShort, ...prev]);
    setActiveShortId(newShort.id);
  }

  return (
    <div
      className="h-screen overflow-hidden"
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 320px",
        gridTemplateRows: "60px 1fr",
        minWidth: 1200,
      }}
    >
      <div style={{ gridColumn: "1 / -1" }}>
        <DashboardHeader creator={creator} creators={creators} />
      </div>
      <EpisodeSidebar
        episodes={episodes}
        shorts={shorts}
        activeEpisodeId={activeEpisodeId}
        onSelectEpisode={setActiveEpisodeId}
      />
      <MainWorkspace
        creator={creator}
        episode={activeEpisode}
        episodeShorts={episodeShorts}
        activeShortId={activeShortId}
        onSelectShort={setActiveShortId}
        onAddShort={addShort}
        episodes={episodes}
      />
      <PipelinePanel
        activeShort={activeShort}
        creator={creator}
        creators={creators}
      />
    </div>
  );
}
