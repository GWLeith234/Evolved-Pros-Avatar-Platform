"use client";

import { useState } from "react";
import { signInAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signInAction(email, password);

    // Only reaches here if redirect didn't fire (i.e. error)
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <form
        onSubmit={handleLogin}
        className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold text-white text-center">Log In</h1>
        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
        <p className="text-gray-400 text-sm text-center">
          Don&apos;t have an account?{" "}
          <a href="/auth/signup" className="text-blue-400 hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </main>
  );
}
