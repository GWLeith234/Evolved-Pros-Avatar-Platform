import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { shortId, script, voiceId } = await request.json();

    if (!shortId || !script || !voiceId) {
      return NextResponse.json(
        { error: "Missing required fields: shortId, script, voiceId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Update status to voice_rendering
    await supabase
      .from("shorts")
      .update({ status: "voice_rendering" } as never)
      .eq("id", shortId);

    // Call ElevenLabs TTS with timestamps
    const elevenLabsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
        }),
      }
    );

    if (!elevenLabsRes.ok) {
      const errText = await elevenLabsRes.text();
      await supabase
        .from("shorts")
        .update({ status: "error", error_message: `ElevenLabs error: ${errText}` } as never)
        .eq("id", shortId);
      return NextResponse.json(
        { error: "ElevenLabs API failed", details: errText },
        { status: 502 }
      );
    }

    const result = await elevenLabsRes.json();

    // Decode base64 audio
    const audioBuffer = Buffer.from(result.audio_base64, "base64");

    // Upload .mp3 to storage
    const audioPath = `${shortId}/voice.mp3`;
    const { error: uploadError } = await supabase.storage
      .from("shorts-output")
      .upload(audioPath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      await supabase
        .from("shorts")
        .update({ status: "error", error_message: `Storage upload error: ${uploadError.message}` } as never)
        .eq("id", shortId);
      return NextResponse.json(
        { error: "Failed to upload audio", details: uploadError.message },
        { status: 500 }
      );
    }

    // Upload timestamps JSON
    const timestampsPath = `${shortId}/timestamps.json`;
    const timestampsData = JSON.stringify({
      characters: result.characters,
      character_start_times_seconds: result.character_start_times_seconds,
      character_end_times_seconds: result.character_end_times_seconds,
    });

    await supabase.storage
      .from("shorts-output")
      .upload(timestampsPath, timestampsData, {
        contentType: "application/json",
        upsert: true,
      });

    // Get public URL for the audio
    const { data: publicUrlData } = supabase.storage
      .from("shorts-output")
      .getPublicUrl(audioPath);

    const audioUrl = publicUrlData.publicUrl;

    // Update short record
    await supabase
      .from("shorts")
      .update({
        elevenlabs_audio_url: audioUrl,
        status: "avatar_generating",
      } as never)
      .eq("id", shortId);

    // Fetch the short to get the creator's avatar ID
    const { data: short } = await supabase
      .from("shorts")
      .select("creator_id")
      .eq("id", shortId)
      .single();

    if (!short) {
      return NextResponse.json({ error: "Short not found" }, { status: 404 });
    }

    const { data: creator } = await supabase
      .from("creators")
      .select("synthesia_avatar_id")
      .eq("id", (short as { creator_id: string }).creator_id)
      .single() as { data: { synthesia_avatar_id: string | null } | null };

    const avatarId = creator?.synthesia_avatar_id;

    // Chain to avatar generation if avatarId is available
    if (avatarId) {
      const baseUrl = request.nextUrl.origin;
      fetch(`${baseUrl}/api/pipeline/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortId, avatarId, audioUrl }),
      }).catch((err) => {
        console.error("Failed to trigger avatar pipeline:", err);
      });
    }

    return NextResponse.json({
      success: true,
      audioUrl,
      avatarTriggered: !!avatarId,
    });
  } catch (err) {
    console.error("Voice pipeline error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
