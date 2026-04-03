import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type ShortsInsert = Database["public"]["Tables"]["shorts"]["Insert"];

export async function POST() {
  const supabase = createAdminClient();

  try {
    // Ensure a test creator exists
    const { data: existingCreator } = await supabase
      .from("creators")
      .select("id")
      .eq("name", "__test_harness__")
      .limit(1)
      .single();

    let creatorId = existingCreator?.id;

    if (!creatorId) {
      const { data: newCreator, error: creatorErr } = await supabase
        .from("creators")
        .insert({ name: "__test_harness__", show_name: "Test Show" })
        .select("id")
        .single();

      if (creatorErr || !newCreator) {
        return NextResponse.json(
          { success: false, error: `Creator insert failed: ${creatorErr?.message}` },
          { status: 500 }
        );
      }
      creatorId = newCreator.id;
    }

    // Ensure a test episode exists
    const { data: existingEpisode } = await supabase
      .from("episodes")
      .select("id")
      .eq("creator_id", creatorId)
      .eq("title", "__test_episode__")
      .limit(1)
      .single();

    let episodeId = existingEpisode?.id;

    if (!episodeId) {
      const { data: newEpisode, error: episodeErr } = await supabase
        .from("episodes")
        .insert({ creator_id: creatorId, title: "__test_episode__" })
        .select("id")
        .single();

      if (episodeErr || !newEpisode) {
        return NextResponse.json(
          { success: false, error: `Episode insert failed: ${episodeErr?.message}` },
          { status: 500 }
        );
      }
      episodeId = newEpisode.id;
    }

    // Insert a test short
    const shortData: ShortsInsert = {
      episode_id: episodeId,
      creator_id: creatorId,
      script_text: "Test script from harness",
      status: "draft",
    };

    const { data: newShort, error: shortErr } = await supabase
      .from("shorts")
      .insert(shortData)
      .select("id, status, script_text, created_at")
      .single();

    if (shortErr || !newShort) {
      return NextResponse.json(
        { success: false, error: `Short insert failed: ${shortErr?.message}` },
        { status: 500 }
      );
    }

    // Read it back
    const { data: readBack, error: readErr } = await supabase
      .from("shorts")
      .select("id, status, script_text")
      .eq("id", newShort.id)
      .single();

    if (readErr || !readBack) {
      return NextResponse.json(
        { success: false, error: `Short read failed: ${readErr?.message}` },
        { status: 500 }
      );
    }

    // Clean up test short
    await supabase.from("shorts").delete().eq("id", newShort.id);

    return NextResponse.json({
      success: true,
      short: readBack,
      creatorId,
      episodeId,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
