export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import crypto from "crypto";

type ShortsUpdate = Database["public"]["Tables"]["shorts"]["Update"];

function verifyHeyGenSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-heygen-signature");
    const secret = process.env.HEYGEN_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (secret) {
      if (!verifyHeyGenSignature(rawBody, signature, secret)) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const body = JSON.parse(rawBody);
    const { event_type, event_data } = body;

    if (!event_type || !event_data) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const callbackId = event_data.callback_id;

    if (!callbackId) {
      return NextResponse.json(
        { error: "Missing callback_id in event_data" },
        { status: 400 }
      );
    }

    if (event_type === "avatar_video.success") {
      const videoUrl = event_data.video_url;

      if (!videoUrl) {
        return NextResponse.json(
          { error: "Missing video_url in success event" },
          { status: 400 }
        );
      }

      // Download the video from HeyGen
      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) {
        await supabase
          .from("shorts")
          .update({
            status: "error",
            error_message: `Failed to download HeyGen video: ${videoRes.status}`,
          } satisfies ShortsUpdate)
          .eq("id", callbackId);
        return NextResponse.json(
          { error: "Failed to download video" },
          { status: 502 }
        );
      }

      const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

      // Upload to Supabase storage
      const storagePath = `${callbackId}/avatar.mp4`;
      const { error: uploadError } = await supabase.storage
        .from("shorts-output")
        .upload(storagePath, videoBuffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (uploadError) {
        await supabase
          .from("shorts")
          .update({
            status: "error",
            error_message: `Storage upload error: ${uploadError.message}`,
          } satisfies ShortsUpdate)
          .eq("id", callbackId);
        return NextResponse.json(
          { error: "Failed to upload video to storage" },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("shorts-output")
        .getPublicUrl(storagePath);

      // Update short: set video URL and advance status to compositing
      await supabase
        .from("shorts")
        .update({
          heygen_video_url: publicUrlData.publicUrl,
          status: "compositing",
        } satisfies ShortsUpdate)
        .eq("id", callbackId);

      // Trigger the render pipeline
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      const proto = request.headers.get("x-forwarded-proto") || "https";
      const baseUrl = `${proto}://${host}`;
      fetch(`${baseUrl}/api/pipeline/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortId: callbackId }),
      }).catch((err) => {
        console.error("Failed to trigger render pipeline:", err);
      });

      return NextResponse.json({ success: true, status: "compositing" });
    }

    if (event_type === "avatar_video.fail") {
      const errorMessage =
        event_data.error?.message ||
        event_data.msg ||
        "HeyGen video generation failed";

      await supabase
        .from("shorts")
        .update({
          status: "error",
          error_message: errorMessage,
        } satisfies ShortsUpdate)
        .eq("id", callbackId);

      return NextResponse.json({ success: true, status: "error" });
    }

    // Unknown event type — acknowledge but don't process
    return NextResponse.json({ success: true, status: "ignored" });
  } catch (err) {
    console.error("HeyGen webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
