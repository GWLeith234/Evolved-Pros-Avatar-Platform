"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function createActionClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll();
        },
        async setAll(cookiesToSet) {
          const store = await cookieStore;
          cookiesToSet.forEach(({ name, value, options }) =>
            store.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function signInAction(email: string, password: string) {
  const supabase = createActionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signUpAction(
  email: string,
  password: string,
  name: string
) {
  const supabase = createActionClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = createActionClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
