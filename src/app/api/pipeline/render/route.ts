import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { convertTimestamps } from "@/lib/captions";
import { renderMediaOnLambda, getRenderProgress } from "@remotion/lambda/client";
import { mux } from "@/lib/mux";

export const maxDuration = 300;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const { shortId } = await request.json();

    if (!shortId) {
      return NextResponse.json(
        { error: "Missing required field: shortId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Fetch the short record
    const { data: short, error: shortError } = await supabase
      .from("shorts")
      .select("id, creator_id, heygen_video_url")
      .eq("id", shortId)
      .single();

    if (shortError || !short) {
      return NextResponse.json(
        { error: "Short not found", details: shortError?.message },
        { status: 404 }
      );
    }

    const typedShort = short as {
      id: string;
      creator_id: string;
      heygen_video_url: string | null;
    };

    if (!typedShort.heygen_video_url) {
      return NextResponse.json(
        { error: "Short has no HeyGen video URL" },
        { status: 400 }
      );
    }

    // Fetch creator branding
    const { data: creator } = (await supabase
      .from("creators")
      .select("name, show_name")
      .eq("id", typedShort.creator_id)
      .single()) as {
      data: { name: string; show_name: string | null } | null;
    };

    // 2. Fetch timestamps.json from storage
    const { data: timestampsData, error: tsError } = await supabase.storage
      .from("shorts-output")
      .download(`${shortId}/timestamps.json`);

    if (tsError || !timestampsData) {
      return NextResponse.json(
        { error: "timestamps.json not found in storage", details: tsError?.message },
        { status: 404 }
      );
    }

    const timestampsText = await timestampsData.text();
    const parsedTimestamps = JSON.parse(timestampsText);

    // Build word-level timestamps from ElevenLabs format
    const wordTimestamps: Array<{ word: string; start: number; end: number }> = [];

    if (parsedTimestamps.characters && parsedTimestamps.character_start_times_seconds) {
      // ElevenLabs returns character-level; aggregate into words
      const chars: string[] = parsedTimestamps.characters;
      const starts: number[] = parsedTimestamps.character_start_times_seconds;
      const ends: number[] = parsedTimestamps.character_end_times_seconds;

      let wordStart = 0;
      let currentWord = "";

      for (let i = 0; i < chars.length; i++) {
        if (chars[i] === " " || chars[i] === "\n") {
          if (currentWord.trim()) {
            wordTimestamps.push({
              word: currentWord.trim(),
              start: starts[wordStart],
              end: ends[i - 1],
            });
          }
          currentWord = "";
          wordStart = i + 1;
        } else {
          currentWord += chars[i];
        }
      }
      // Last word
      if (currentWord.trim()) {
        wordTimestamps.push({
          word: currentWord.trim(),
          start: starts[wordStart],
          end: ends[chars.length - 1],
        });
      }
    } else if (Array.isArray(parsedTimestamps)) {
      // Already in word-level format
      wordTimestamps.push(...parsedTimestamps);
    }

    // 3. Convert timestamps to frames
    const captions = convertTimestamps(wordTimestamps);

    // 4. Render on Lambda
    const region = (process.env.AWS_REGION || "us-east-1") as "us-east-1";
    const { renderId, bucketName } = await renderMediaOnLambda({
      region,
      functionName: process.env.REMOTION_FUNCTION_NAME!,
      serveUrl: process.env.REMOTION_SERVE_URL!,
      composition: "Short",
      inputProps: {
        avatarVideoUrl: typedShort.heygen_video_url,
        captions,
        creatorName: creator?.name ?? "Creator",
        showName: creator?.show_name ?? "",
      },
      codec: "h264",
      outName: `shorts-output/${shortId}/final.mp4`,
    });

    // 5. Poll for render progress
    let done = false;
    let outputUrl: string | undefined;

    while (!done) {
      await sleep(5000);
      const progress = await getRenderProgress({
        renderId,
        bucketName,
        functionName: process.env.REMOTION_FUNCTION_NAME!,
        region,
      });

      if (progress.fatalErrorEncountered) {
        await supabase
          .from("shorts")
          .update({
            status: "error",
            error_message: `Remotion render failed: ${progress.errors?.[0]?.message ?? "unknown error"}`,
          } as never)
          .eq("id", shortId);
        return NextResponse.json(
          { error: "Render failed", details: progress.errors },
          { status: 500 }
        );
      }

      if (progress.done) {
        done = true;
        outputUrl = progress.outputFile ?? undefined;
      }
    }

    if (!outputUrl) {
      return NextResponse.json(
        { error: "Render completed but no output URL" },
        { status: 500 }
      );
    }

    // 6. Upload rendered video to Supabase storage
    const videoRes = await fetch(outputUrl);
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    const finalPath = `${shortId}/final.mp4`;

    await supabase.storage
      .from("shorts-output")
      .upload(finalPath, videoBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    const { data: publicUrlData } = supabase.storage
      .from("shorts-output")
      .getPublicUrl(finalPath);

    // 7. Upload to Mux
    const asset = await mux.video.assets.create({
      inputs: [{ url: outputUrl }],
      playback_policy: ["public"],
      passthrough: shortId,
    });

    // 8. Update short — status stays 'compositing' until Mux webhook fires 'ready'
    await supabase
      .from("shorts")
      .update({
        final_mp4_url: publicUrlData.publicUrl,
        mux_asset_id: asset.id,
        status: "compositing",
      } as never)
      .eq("id", shortId);

    return NextResponse.json({
      success: true,
      renderId,
      outputUrl,
      muxAssetId: asset.id,
      finalStorageUrl: publicUrlData.publicUrl,
    });
  } catch (err) {
    console.error("Render pipeline error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
