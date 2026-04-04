import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("habits")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowed = ["title", "pillar_ids", "xp_value", "leverage_score", "is_active", "sort_order"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data: habit, error } = await supabase
      .from("habits")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(habit);
  } catch (err) {
    console.error("Update habit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
