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

  // Sync streaming output to editable textarea
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
    <div className="bg-gray-900 rounded-xl p-6 space-y-4 max-w-xl w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg font-[Montserrat]">
          Script Editor
        </h3>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px] font-[Montserrat] uppercase tracking-wider">
            {displayWordCount} words
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-[Montserrat] uppercase tracking-wider bg-[#7AB3D0]/20 text-[#7AB3D0]">
            ~{displayDuration}s
          </span>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={editableScript}
          onChange={(e) => setEditableScript(e.target.value)}
          placeholder="Click Generate to create a script..."
          rows={6}
          className={`w-full bg-gray-800 text-white rounded-lg p-4 border border-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#7AB3D0] text-sm leading-relaxed ${
            isLoading ? "animate-pulse opacity-80" : ""
          }`}
        />
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => generate(episodeTitle, transcript)}
          disabled={isLoading}
          className="w-full py-2.5 rounded-lg font-medium text-sm text-white transition-colors disabled:opacity-50 bg-[#C0272D] hover:bg-[#a02025]"
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
              className="px-3 py-1.5 rounded-lg text-xs text-gray-300 border border-gray-700 hover:border-gray-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
