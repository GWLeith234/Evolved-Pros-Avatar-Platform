import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { shortId, avatarId, audioUrl } = await request.json();

    if (!shortId || !avatarId || !audioUrl) {
      return NextResponse.json(
        { error: "Missing required fields: shortId, avatarId, audioUrl" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Call HeyGen video generation API
    const heygenRes = await fetch("https://api.heygen.com/v2/video_generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.HEYGEN_API_KEY!,
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: avatarId,
            },
            voice: {
              type: "audio",
              audio_url: audioUrl,
            },
          },
        ],
        dimension: { width: 1080, height: 1920 },
        callback_id: shortId,
      }),
    });

    if (!heygenRes.ok) {
      const errText = await heygenRes.text();
      await supabase
        .from("shorts")
        .update({ status: "error", error_message: `HeyGen error: ${errText}` } as never)
        .eq("id", shortId);
      return NextResponse.json(
        { error: "HeyGen API failed", details: errText },
        { status: 502 }
      );
    }

    const result = await heygenRes.json();
    const videoId = result.data?.video_id;

    if (!videoId) {
      await supabase
        .from("shorts")
        .update({
          status: "error",
          error_message: "HeyGen did not return a video_id",
        } as never)
        .eq("id", shortId);
      return NextResponse.json(
        { error: "No video_id in HeyGen response", details: result },
        { status: 502 }
      );
    }

    // Store heygen_video_id; status stays 'avatar_generating' until webhook fires
    await supabase
      .from("shorts")
      .update({ heygen_video_id: videoId } as never)
      .eq("id", shortId);

    return NextResponse.json({
      success: true,
      videoId,
    });
  } catch (err) {
    console.error("Avatar pipeline error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
