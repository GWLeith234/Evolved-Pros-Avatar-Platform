"use client";

import type { Database } from "@/lib/supabase/types";
import { usePipeline } from "@/hooks/usePipeline";

type Creator = Database["public"]["Tables"]["users"]["Row"];
type Short = Database["public"]["Tables"]["shorts"]["Row"];

interface PipelinePanelProps {
  activeShort: Short | null;
  creator: Creator;
  creators: Creator[];
}

type StepState = "done" | "active" | "waiting";

interface PipelineStep {
  name: string;
  subtitle: string;
  state: StepState;
}

function getSteps(short: Short | null): PipelineStep[] {
  const steps: PipelineStep[] = [
    { name: "Script", subtitle: "Claude AI generation", state: "waiting" },
    { name: "Voice render", subtitle: "ElevenLabs TTS", state: "waiting" },
    { name: "Avatar video", subtitle: "HeyGen generation", state: "waiting" },
    { name: "Remotion compose", subtitle: "Video compositing", state: "waiting" },
    { name: "Export mp4", subtitle: "Mux delivery", state: "waiting" },
  ];

  if (!short) return steps;

  const status = short.status;

  // Script step
  if (short.script_text) steps[0].state = "done";
  else if (status === "draft") steps[0].state = "active";

  // Voice step
  if (short.elevenlabs_audio_url) steps[1].state = "done";
  else if (status === "voice_rendering") { steps[0].state = "done"; steps[1].state = "active"; }

  // Avatar step
  if (short.heygen_video_url) steps[2].state = "done";
  else if (status === "avatar_generating") {
    steps[0].state = "done"; steps[1].state = "done"; steps[2].state = "active";
  }

  // Compose step
  if (status === "compositing") {
    steps[0].state = "done"; steps[1].state = "done"; steps[2].state = "done";
    steps[3].state = "active";
  }

  // Export step
  if (short.mux_playback_id) {
    steps[0].state = "done"; steps[1].state = "done"; steps[2].state = "done";
    steps[3].state = "done"; steps[4].state = "done";
  } else if (status === "done") {
    steps.forEach((s) => (s.state = "done"));
  }

  return steps;
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const stepIcons: Record<StepState, { bg: string; text: string; icon: string }> = {
  done: { bg: "#e8f7ee", text: "#1a8a4a", icon: "✓" },
  active: { bg: "#e3f4fa", text: "#0e7a9a", icon: "◉" },
  waiting: { bg: "#EEF1F5", text: "#6B6B6B", icon: "○" },
};

export default function PipelinePanel({
  activeShort,
  creator,
  creators,
}: PipelinePanelProps) {
  const { generateShort, isGenerating, error } = usePipeline();
  const steps = getSteps(activeShort);

  return (
    <aside
      className="overflow-y-auto flex flex-col border-l"
      style={{ background: "#FFFFFF", borderColor: "#D8DDE5" }}
    >
      {/* Pipeline steps */}
      <div className="px-4 pt-5 pb-4">
        <span
          className="text-[10px] uppercase tracking-widest block mb-3"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            color: "#6B6B6B",
          }}
        >
          Pipeline
        </span>
        {activeShort ? (
          <div className="flex flex-col gap-0.5">
            {steps.map((step) => {
              const ic = stepIcons[step.state];
              return (
                <div key={step.name} className="flex items-center gap-3 py-[9px]">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{
                      background: ic.bg,
                      color: ic.text,
                      animation: step.state === "active" ? "pulse 2s infinite" : undefined,
                    }}
                  >
                    {ic.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[12px] block"
                      style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontWeight: 600,
                        color: "#0D1B2A",
                      }}
                    >
                      {step.name}
                    </span>
                    <span
                      className="text-[11px] block"
                      style={{
                        fontFamily: "'Roboto Condensed', sans-serif",
                        color: "#6B6B6B",
                      }}
                    >
                      {step.subtitle}
                    </span>
                    {step.state === "active" && (
                      <div
                        className="mt-1.5 h-1 rounded-full overflow-hidden"
                        style={{ background: "#EEF1F5" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            background: "#7AB3D0",
                            width: "60%",
                            animation: "pulse 2s infinite",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {activeShort.status === "error" && activeShort.error_message && (
              <div
                className="mt-2 text-[11px] px-3 py-2 rounded-lg"
                style={{
                  background: "#fdecea",
                  color: "#C0272D",
                  fontFamily: "'Roboto Condensed', sans-serif",
                }}
              >
                {activeShort.error_message}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[12px]" style={{ color: "#6B6B6B" }}>
            Select a short to view pipeline
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t" style={{ borderColor: "#D8DDE5" }} />

      {/* Connected services */}
      <div className="px-4 py-4">
        <span
          className="text-[10px] uppercase tracking-widest block mb-3"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            color: "#6B6B6B",
          }}
        >
          Connected Services
        </span>
        {["ElevenLabs", "HeyGen", "Remotion"].map((svc) => (
          <div key={svc} className="flex items-center gap-2.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span
              className="text-[12px]"
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                color: "#0D1B2A",
              }}
            >
              {svc}
            </span>
            <span
              className="ml-auto text-[9px] px-1.5 py-0.5 rounded"
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 600,
                color: "#1a8a4a",
                background: "#e8f7ee",
              }}
            >
              Active
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t" style={{ borderColor: "#D8DDE5" }} />

      {/* Creators list */}
      <div className="px-4 py-4 flex-1">
        <span
          className="text-[10px] uppercase tracking-widest block mb-3"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            color: "#6B6B6B",
          }}
        >
          All Creators
        </span>
        <div className="flex flex-col gap-1">
          {creators.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2.5 px-2 py-2 rounded-lg"
              style={{
                background: c.id === creator.id ? "rgba(122,179,208,.08)" : "transparent",
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] shrink-0"
                style={{
                  background: c.id === creator.id ? "#C0272D" : "#3D5A70",
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                }}
              >
                {getInitials(c.name)}
              </div>
              <div className="min-w-0">
                <span
                  className="text-[12px] block truncate"
                  style={{
                    fontFamily: "'Roboto Condensed', sans-serif",
                    color: "#0D1B2A",
                  }}
                >
                  {c.name}
                </span>
                {c.show_name && (
                  <span
                    className="text-[10px] block truncate"
                    style={{ color: "#7AB3D0" }}
                  >
                    {c.show_name}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div
            className="flex items-center justify-center py-2.5 rounded-lg border border-dashed mt-1 cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: "#D8DDE5" }}
          >
            <span className="text-[11px]" style={{ color: "#6B6B6B" }}>
              + Add creator
            </span>
          </div>
        </div>
      </div>

      {/* Generate button footer */}
      <div className="px-4 py-4 mt-auto border-t" style={{ borderColor: "#D8DDE5" }}>
        {error && (
          <p className="text-[11px] text-[#C0272D] mb-2">{error}</p>
        )}
        <button
          onClick={() => activeShort && generateShort(activeShort.id)}
          disabled={!activeShort || isGenerating}
          className="w-full py-3 rounded-lg text-white transition-colors disabled:opacity-40"
          style={{
            background: "#C0272D",
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {isGenerating ? "Generating..." : "Generate Short ▶"}
        </button>
        <p
          className="text-center mt-1.5 text-[10px]"
          style={{ color: "#6B6B6B" }}
        >
          ElevenLabs · HeyGen · Remotion
        </p>
      </div>
    </aside>
  );
}
