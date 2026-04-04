import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasTierAccess } from "@/lib/tier";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Tier check
    const { data: creator } = await supabase
      .from("creators")
      .select("tier")
      .eq("id", user.id)
      .single();

    if (!creator || !hasTierAccess(creator.tier, "vip")) {
      return NextResponse.json({ error: "VIP required" }, { status: 403 });
    }

    const { title, pillar_ids, xp_value, leverage_score } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    // Get max sort_order
    const { data: maxRow } = await supabase
      .from("habits")
      .select("sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxRow?.sort_order ?? 0) + 1;

    const { data: habit, error } = await supabase
      .from("habits")
      .insert({
        user_id: user.id,
        title,
        pillar_ids: pillar_ids ?? [],
        xp_value: xp_value ?? 10,
        leverage_score: leverage_score ?? 1,
        sort_order: nextOrder,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(habit);
  } catch (err) {
    console.error("Create habit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
