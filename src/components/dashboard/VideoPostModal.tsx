"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { POST_TYPE_LABELS } from "@/lib/prompts";
import type { Database } from "@/lib/supabase/types";

type Short = Database["public"]["Tables"]["shorts"]["Row"];

interface VideoPostModalProps {
  creatorId: string;
  onClose: () => void;
  onCreated: (short: Short) => void;
}

const postTypes = Object.entries(POST_TYPE_LABELS) as [string, string][];

const placeholders: Record<string, { title: string; bullets: string }> = {
  episode_promo: {
    title: "Episode title",
    bullets: "The insight, the guest, the hook",
  },
  interview_promo: {
    title: "Guest name + credential",
    bullets: "Who they are, what they said, why it matters",
  },
  event_promo: {
    title: "Event name + date",
    bullets: "What it is, who it's for, what they get",
  },
  product_promo: {
    title: "Product or service name",
    bullets: "The problem, the solution, the outcome",
  },
  industry_take: {
    title: "Headline or topic",
    bullets: "The common view, your take, why it matters",
  },
};

export default function VideoPostModal({
  creatorId,
  onClose,
  onCreated,
}: VideoPostModalProps) {
  const [postType, setPostType] = useState("episode_promo");
  const [postTitle, setPostTitle] = useState("");
  const [postBullets, setPostBullets] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ph = placeholders[postType] ?? placeholders.episode_promo;

  async function handleCreate() {
    if (!postTitle.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("shorts")
      .insert({
        creator_id: creatorId,
        status: "draft",
        post_type: postType,
        post_title: postTitle,
        post_bullets: postBullets,
        script_text: "",
      })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to create video post");
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
        className="rounded-xl shadow-xl w-full max-w-md p-5"
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
          New Video Post
        </h3>

        {/* Post type selector */}
        <label
          className="text-[11px] uppercase tracking-wider block mb-2"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 600,
            color: "#3D5A70",
          }}
        >
          Post type
        </label>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {postTypes.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPostType(key)}
              className="px-3 py-1.5 rounded-lg text-[11px] border transition-colors"
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 600,
                color: postType === key ? "#FFFFFF" : "#3D5A70",
                background: postType === key ? "#7AB3D0" : "transparent",
                borderColor: postType === key ? "#7AB3D0" : "#D8DDE5",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Title */}
        <label
          className="text-[11px] uppercase tracking-wider block mb-1.5"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 600,
            color: "#3D5A70",
          }}
        >
          Title
        </label>
        <input
          type="text"
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
          placeholder={ph.title}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#7AB3D0]"
          style={{
            borderColor: "#D8DDE5",
            fontFamily: "'Roboto Condensed', sans-serif",
            color: "#0D1B2A",
          }}
        />

        {/* Bullets */}
        <label
          className="text-[11px] uppercase tracking-wider block mb-1.5"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 600,
            color: "#3D5A70",
          }}
        >
          Key points (2-3 bullets)
        </label>
        <textarea
          value={postBullets}
          onChange={(e) => setPostBullets(e.target.value)}
          placeholder={ph.bullets}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#7AB3D0]"
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
            disabled={loading || !postTitle.trim()}
            className="px-4 py-2 rounded-lg text-[12px] text-white transition-colors disabled:opacity-50"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 600,
              background: "#7AB3D0",
            }}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
