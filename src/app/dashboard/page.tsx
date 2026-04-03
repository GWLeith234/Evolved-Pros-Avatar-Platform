import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { redirect } from "next/navigation";

type Creator = Database["public"]["Tables"]["creators"]["Row"];
type Short = Database["public"]["Tables"]["shorts"]["Row"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", user.id)
    .single() as { data: Creator | null };

  const { data: shorts } = await supabase
    .from("shorts")
    .select("id, script_text, status, created_at")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10) as { data: Pick<Short, "id" | "script_text" | "status" | "created_at">[] | null };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
            >
              Sign Out
            </button>
          </form>
        </div>

        <section className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Creator Profile</h2>
          <p>
            <span className="text-gray-400">Name:</span>{" "}
            {creator?.name ?? "—"}
          </p>
          <p>
            <span className="text-gray-400">Show:</span>{" "}
            {creator?.show_name ?? "Not set"}
          </p>
        </section>

        <section className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Shorts</h2>
          {shorts && shorts.length > 0 ? (
            <ul className="space-y-3">
              {shorts.map((s) => (
                <li
                  key={s.id}
                  className="flex justify-between items-center bg-gray-800 rounded px-4 py-3"
                >
                  <span className="truncate max-w-xs">
                    {s.script_text?.slice(0, 80) ?? "No script"}
                  </span>
                  <span className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300">
                    {s.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No shorts yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
