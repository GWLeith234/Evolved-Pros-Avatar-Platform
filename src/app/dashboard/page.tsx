import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

type Creator = Database["public"]["Tables"]["creators"]["Row"];
type Episode = Database["public"]["Tables"]["episodes"]["Row"];
type Short = Database["public"]["Tables"]["shorts"]["Row"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch current creator
  const { data: creator } = (await supabase
    .from("creators")
    .select("*")
    .eq("id", user.id)
    .single()) as { data: Creator | null };

  if (!creator) {
    redirect("/auth/login");
  }

  // Fetch all creators (for switcher)
  const { data: creators } = (await supabase
    .from("creators")
    .select("*")
    .order("name")) as { data: Creator[] | null };

  // Fetch creator's episodes
  const { data: episodes } = (await supabase
    .from("episodes")
    .select("*")
    .eq("creator_id", creator.id)
    .order("published_at", { ascending: false })) as { data: Episode[] | null };

  // Fetch creator's shorts
  const { data: shorts } = (await supabase
    .from("shorts")
    .select("*")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false })) as { data: Short[] | null };

  return (
    <DashboardLayout
      creator={creator}
      creators={creators ?? []}
      episodes={episodes ?? []}
      shorts={shorts ?? []}
    />
  );
}
