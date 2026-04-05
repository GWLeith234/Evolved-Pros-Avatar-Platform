import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * One-time seed endpoint. Creates the initial user and users table row.
 * DELETE THIS FILE after seeding is complete.
 *
 * Call: POST /api/seed with header X-Seed-Key matching SUPABASE_SERVICE_ROLE_KEY
 */
export async function POST(request: NextRequest) {
  const seedKey = request.headers.get("x-seed-key");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!seedKey || seedKey !== serviceKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: "geoleith@gmail.com",
    password: "EvolvedPros2026!",
    email_confirm: true,
  });

  if (authError) {
    // User may already exist
    if (authError.message?.includes("already been registered")) {
      return NextResponse.json({ message: "User already exists in auth", step: "auth_skip" });
    }
    return NextResponse.json({ error: authError.message, step: "auth_create" }, { status: 500 });
  }

  const userId = authUser.user.id;

  // 2. Upsert row in users table
  const { error: upsertError } = await supabase
    .from("users")
    .upsert(
      {
        id: userId,
        name: "George Leith",
        show_name: "EvolvedPros",
        system_prompt:
          "conversational, direct, authority without arrogance. Short punchy sentences. No fluff. Speaks to business owners and sales professionals.",
        tier: "pro",
      },
      { onConflict: "id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message, step: "users_upsert", userId }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    userId,
    email: "geoleith@gmail.com",
    message: "User created and seeded. DELETE /api/seed/route.ts now.",
  });
}
