import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test 1: Check Supabase connection
    const { data: user, error: authError } = await supabase.auth.getUser();
    const authStatus = authError ? "not authenticated" : `authenticated as ${user.user?.email}`;

    // Test 2: Try to query creators table (will return empty if not authed)
    const { error: creatorsError } = await supabase
      .from("creators")
      .select("id")
      .limit(1);

    // Test 3: Try to query shorts table
    const { error: shortsError } = await supabase
      .from("shorts")
      .select("id")
      .limit(1);

    return NextResponse.json({
      status: "ok",
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing",
      auth: authStatus,
      tables: {
        creators: creatorsError ? `error: ${creatorsError.message}` : "accessible",
        shorts: shortsError ? `error: ${shortsError.message}` : "accessible",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: String(err) },
      { status: 500 }
    );
  }
}
