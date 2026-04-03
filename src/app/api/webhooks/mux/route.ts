import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mux } from "@/lib/mux";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    // Verify Mux webhook signature
    let event;
    try {
      event = mux.webhooks.unwrap(rawBody, headers, process.env.MUX_WEBHOOK_SECRET!);
    } catch (err) {
      console.error("Mux webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const eventType = event.type;
    const data = event.data as Record<string, unknown>;

    if (eventType === "video.asset.ready") {
      const playbackIds = data.playback_ids as Array<{ id: string }> | undefined;
      const playbackId = playbackIds?.[0]?.id;
      const shortId = data.passthrough as string | undefined;

      if (!shortId) {
        return NextResponse.json(
          { error: "Missing passthrough (shortId) in event" },
          { status: 400 }
        );
      }

      await supabase
        .from("shorts")
        .update({
          mux_playback_id: playbackId,
          status: "done",
        } as never)
        .eq("id", shortId);

      return NextResponse.json({ success: true, status: "done" });
    }

    if (eventType === "video.asset.errored") {
      const shortId = data.passthrough as string | undefined;
      const errors = data.errors as { messages?: string[] } | undefined;
      const errorMessage = errors?.messages?.join(", ") ?? "Mux encoding failed";

      if (!shortId) {
        return NextResponse.json(
          { error: "Missing passthrough (shortId) in event" },
          { status: 400 }
        );
      }

      await supabase
        .from("shorts")
        .update({
          status: "error",
          error_message: errorMessage,
        } as never)
        .eq("id", shortId);

      return NextResponse.json({ success: true, status: "error" });
    }

    // Unhandled event type — acknowledge
    return NextResponse.json({ success: true, status: "ignored" });
  } catch (err) {
    console.error("Mux webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
