import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  const tables = ["creators", "episodes", "shorts"] as const;
  const results: Record<string, { accessible: boolean; error?: string; columns?: string[] }> = {};

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(0);
    if (error) {
      results[table] = { accessible: false, error: error.message };
    } else {
      // Column names come from the empty row shape — use a real row if available
      const { data: sample } = await supabase.from(table).select("*").limit(1);
      const columns = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
      results[table] = { accessible: true, columns };
    }
  }

  const allAccessible = Object.values(results).every((r) => r.accessible);

  return NextResponse.json({
    status: allAccessible ? "ok" : "partial",
    tables: results,
  });
}
