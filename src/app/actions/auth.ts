"use server";

/* Server Actions for Supabase auth — login, signup, signout */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function createActionClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // May fail in read-only contexts
          }
        },
      },
    }
  );
}

export async function signInAction(email: string, password: string) {
  const supabase = await createActionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signUpAction(
  email: string,
  password: string,
  name: string
) {
  const supabase = await createActionClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createActionClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
