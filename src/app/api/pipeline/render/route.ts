import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Placeholder render pipeline — Sprint C will implement FFmpeg compositing
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

    // For now, just log that we reached the render stage
    console.log(`Render pipeline triggered for short: ${shortId}`);

    return NextResponse.json({
      success: true,
      message: "Render pipeline placeholder — compositing not yet implemented",
    });
  } catch (err) {
    console.error("Render pipeline error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
