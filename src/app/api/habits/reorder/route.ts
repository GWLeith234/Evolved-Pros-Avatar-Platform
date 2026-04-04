import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
    }

    // Verify all habits belong to user
    const { data: habits } = await supabase
      .from("habits")
      .select("id")
      .eq("user_id", user.id)
      .in("id", orderedIds);

    if (!habits || habits.length !== orderedIds.length) {
      return NextResponse.json({ error: "Invalid habit IDs" }, { status: 403 });
    }

    // Batch update sort_order
    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from("habits")
        .update({ sort_order: i + 1 })
        .eq("id", orderedIds[i]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reorder habits error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
