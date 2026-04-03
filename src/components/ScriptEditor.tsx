"use client";

import { useState, useEffect } from "react";
import { useScriptEditor } from "@/hooks/useScriptEditor";

interface ScriptEditorProps {
  shortId: string;
  episodeTitle: string;
  transcript?: string;
  creatorId: string;
}

export default function ScriptEditor({
  shortId,
  episodeTitle,
  transcript,
  creatorId,
}: ScriptEditorProps) {
  const { script, isLoading, wordCount, estimatedSeconds, generate, rewrite } =
    useScriptEditor(shortId, creatorId);

  const [editableScript, setEditableScript] = useState("");

  useEffect(() => {
    if (script) {
      setEditableScript(script);
    }
  }, [script]);

  const displayWordCount = editableScript
    ? editableScript.trim().split(/\s+/).filter(Boolean).length
    : wordCount;

  const displayDuration = editableScript
    ? Math.round(
        (editableScript.trim().split(/\s+/).filter(Boolean).length / 150) * 60
      )
    : estimatedSeconds;

  return (
    <div
      className="rounded-xl p-5 border"
      style={{ background: "#FFFFFF", borderColor: "#D8DDE5" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-[14px]"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            color: "#0D1B2A",
          }}
        >
          Script Editor
        </h3>
        <div className="flex gap-2">
          <span
            className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 600,
              color: "#3D5A70",
              background: "#EEF1F5",
            }}
          >
            {displayWordCount} words
          </span>
          <span
            className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 600,
              color: "#7AB3D0",
              background: "rgba(122,179,208,.12)",
            }}
          >
            ~{displayDuration}s
          </span>
        </div>
      </div>

      <textarea
        value={editableScript}
        onChange={(e) => setEditableScript(e.target.value)}
        placeholder="Click Generate to create a script..."
        rows={5}
        className={`w-full rounded-lg p-3 border resize-none text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#7AB3D0] ${
          isLoading ? "animate-pulse opacity-80" : ""
        }`}
        style={{
          fontFamily: "'Roboto Condensed', sans-serif",
          background: "#F4F6F8",
          borderColor: "#D8DDE5",
          color: "#0D1B2A",
        }}
      />

      <div className="flex flex-col gap-2.5 mt-3">
        <button
          onClick={() => generate(episodeTitle, transcript)}
          disabled={isLoading}
          className="w-full py-2.5 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 600,
            background: "#C0272D",
          }}
        >
          {isLoading ? "Writing..." : "Generate"}
        </button>

        <div className="flex gap-2 flex-wrap">
          {(
            [
              { action: "punchier", label: "Make punchier" },
              { action: "shorter", label: "Shorter" },
              { action: "add_cta", label: "Add CTA" },
              { action: "new_hook", label: "New hook" },
            ] as const
          ).map(({ action, label }) => (
            <button
              key={action}
              onClick={() => rewrite(action, editableScript)}
              disabled={isLoading || !editableScript}
              className="px-3 py-1.5 rounded-lg text-xs border transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 600,
                color: "#3D5A70",
                borderColor: "#D8DDE5",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
