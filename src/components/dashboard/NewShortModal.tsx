"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Episode = Database["public"]["Tables"]["episodes"]["Row"];
type Short = Database["public"]["Tables"]["shorts"]["Row"];

interface NewShortModalProps {
  creatorId: string;
  episodes: Episode[];
  defaultEpisodeId: string | null;
  onClose: () => void;
  onCreated: (short: Short) => void;
}

export default function NewShortModal({
  creatorId,
  episodes,
  defaultEpisodeId,
  onClose,
  onCreated,
}: NewShortModalProps) {
  const [episodeId, setEpisodeId] = useState(defaultEpisodeId ?? episodes[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!episodeId) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("shorts")
      .insert({
        episode_id: episodeId,
        creator_id: creatorId,
        status: "draft",
        script_text: label || "",
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to create short");
      setLoading(false);
      return;
    }

    onCreated(data as Short);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-xl w-full max-w-sm p-5"
        style={{ background: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-[16px] mb-4"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            color: "#0D1B2A",
          }}
        >
          New Short
        </h3>

        <label
          className="text-[11px] uppercase tracking-wider block mb-1.5"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 600,
            color: "#3D5A70",
          }}
        >
          Episode
        </label>
        <select
          value={episodeId}
          onChange={(e) => setEpisodeId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#7AB3D0]"
          style={{
            borderColor: "#D8DDE5",
            fontFamily: "'Roboto Condensed', sans-serif",
            color: "#0D1B2A",
          }}
        >
          {episodes.map((ep) => (
            <option key={ep.id} value={ep.id}>
              {ep.title}
            </option>
          ))}
        </select>

        <label
          className="text-[11px] uppercase tracking-wider block mb-1.5"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 600,
            color: "#3D5A70",
          }}
        >
          Label (optional)
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Hook variant A"
          className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#7AB3D0]"
          style={{
            borderColor: "#D8DDE5",
            fontFamily: "'Roboto Condensed', sans-serif",
            color: "#0D1B2A",
          }}
        />

        {error && (
          <p className="text-[11px] text-[#C0272D] mb-2">{error}</p>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[12px] border transition-colors hover:bg-gray-50"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 600,
              color: "#3D5A70",
              borderColor: "#D8DDE5",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !episodeId}
            className="px-4 py-2 rounded-lg text-[12px] text-white transition-colors disabled:opacity-50"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 600,
              background: "#C0272D",
            }}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
