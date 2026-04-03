"use client";

import { useCompletion } from "@ai-sdk/react";

export function useScriptEditor(shortId: string, creatorId: string) {
  const { completion, complete, isLoading } = useCompletion({
    api: "/api/scripts/generate",
    streamProtocol: "text",
  });

  const wordCount = completion
    ? completion.trim().split(/\s+/).filter(Boolean).length
    : 0;

  // 150 words per minute average speaking rate
  const estimatedSeconds = Math.round((wordCount / 150) * 60);

  function generate(episodeTitle: string, transcript?: string) {
    complete("", {
      body: { shortId, creatorId, episodeTitle, transcript, action: "generate" },
    });
  }

  function rewrite(
    action: "punchier" | "shorter" | "add_cta" | "new_hook",
    currentScript: string
  ) {
    complete("", {
      body: { shortId, creatorId, action, currentScript },
    });
  }

  return { script: completion, isLoading, wordCount, estimatedSeconds, generate, rewrite };
}
