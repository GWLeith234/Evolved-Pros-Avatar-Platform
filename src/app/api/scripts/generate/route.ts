import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { buildVideoPostPrompt } from "@/lib/prompts";

type ShortsUpdate = Database["public"]["Tables"]["shorts"]["Update"];
type Action = "generate" | "punchier" | "shorter" | "add_cta" | "new_hook";

interface RequestBody {
  shortId: string;
  episodeTitle?: string;
  transcript?: string;
  creatorId: string;
  action: Action;
  currentScript?: string;
  postType?: string;
  postTitle?: string;
  postBullets?: string;
}

function buildUserMessage(body: RequestBody): string {
  switch (body.action) {
    case "generate":
      return `Write a YouTube Short script for this episode:\nTitle: ${body.episodeTitle ?? ""}${
        body.transcript ? `\nContext: ${body.transcript.slice(0, 500)}` : ""
      }`;

    case "punchier":
      return `Make this script punchier. Stronger hook, shorter sentences, more direct. Keep under 65 words:\n${body.currentScript}`;

    case "shorter":
      return `Cut this script to under 45 words. Keep the hook and CTA, trim the middle:\n${body.currentScript}`;

    case "add_cta":
      return `Rewrite the ending of this script with a stronger CTA. Make it urgent. Keep under 65 words total:\n${body.currentScript}`;

    case "new_hook":
      return `Keep everything after the first sentence. Write a completely new opening hook — more provocative, more specific:\n${body.currentScript}`;

    default:
      return `Write a YouTube Short script for this episode:\nTitle: ${body.episodeTitle ?? ""}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    if (!body.shortId || !body.creatorId || !body.action) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: shortId, creatorId, action" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (body.action !== "generate" && !body.currentScript) {
      return new Response(
        JSON.stringify({ error: "currentScript is required for rewrite actions" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createAdminClient();

    // Fetch creator
    const { data: creator, error: creatorError } = await supabase
      .from("users")
      .select("name, show_name, system_prompt")
      .eq("id", body.creatorId)
      .single();

    if (creatorError || !creator) {
      return new Response(
        JSON.stringify({ error: "Creator not found", details: creatorError?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    let systemPrompt: string;
    let userMessage: string;

    // Video post mode — use specialized prompt template
    if (
      body.action === "generate" &&
      body.postType &&
      body.postType !== "episode_short"
    ) {
      systemPrompt = buildVideoPostPrompt(
        creator.name,
        creator.show_name ?? "their show",
        creator.system_prompt,
        body.postType,
        body.postTitle ?? "",
        body.postBullets ?? ""
      );
      userMessage = "Write the script now.";
    } else {
      // Existing episode short logic
      systemPrompt = `You write YouTube Shorts scripts for ${creator.name}, host of ${creator.show_name ?? "their show"}.

Voice and tone: ${creator.system_prompt}

Rules — follow all of these exactly:
- Under 65 words total
- Hook in the first 5 words — make it a statement or question that creates tension
- Middle: one specific insight or stat from the episode
- End: single CTA — tell them to listen, link in bio
- No hashtags, no emojis, no filler phrases like 'In this episode'
- Write as if speaking directly to camera — first person, present tense
- Return ONLY the script. No preamble, no explanation, no quotes around it.`;

      userMessage = buildUserMessage(body);
    }

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      maxOutputTokens: 300,
      onFinish: async ({ text }) => {
        await supabase
          .from("shorts")
          .update({ script_text: text } satisfies ShortsUpdate)
          .eq("id", body.shortId);
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("Script generation error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
