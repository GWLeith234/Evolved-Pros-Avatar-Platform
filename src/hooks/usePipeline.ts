"use client";

import { useState } from "react";

export function usePipeline() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateShort(shortId: string) {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/pipeline/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Pipeline failed to start");
      }
      // Status updates come via Supabase Realtime
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  }

  return { generateShort, isGenerating, error };
}
