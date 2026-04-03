"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "running" | "pending";
  detail?: string;
}

export default function TestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  function update(name: string, status: TestResult["status"], detail?: string) {
    setResults((prev) => {
      const idx = prev.findIndex((r) => r.name === name);
      const entry = { name, status, detail };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = entry;
        return next;
      }
      return [...prev, entry];
    });
  }

  async function runTests() {
    setResults([]);
    setRunning(true);

    // Test 1: Supabase client connects
    update("Supabase client connects", "running");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("creators").select("id").limit(1);
      if (error) {
        update("Supabase client connects", "fail", error.message);
      } else {
        update("Supabase client connects", "pass");
      }
    } catch (err) {
      update("Supabase client connects", "fail", String(err));
    }

    // Test 2: Health endpoint
    update("Health API responds", "running");
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      if (data.status === "ok") {
        update("Health API responds", "pass", JSON.stringify(data));
      } else {
        update("Health API responds", "fail", JSON.stringify(data));
      }
    } catch (err) {
      update("Health API responds", "fail", String(err));
    }

    // Test 3: Schema check
    update("Schema tables exist", "running");
    try {
      const res = await fetch("/api/test/schema");
      const data = await res.json();
      if (data.status === "ok") {
        update("Schema tables exist", "pass", JSON.stringify(data.tables));
      } else {
        update("Schema tables exist", "fail", JSON.stringify(data));
      }
    } catch (err) {
      update("Schema tables exist", "fail", String(err));
    }

    // Test 4: Create and read test short
    update("Insert & read short", "running");
    try {
      const res = await fetch("/api/test/short", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        update(
          "Insert & read short",
          "pass",
          `Created short ${data.short?.id}, status=${data.short?.status}`
        );
      } else {
        update("Insert & read short", "fail", data.error ?? JSON.stringify(data));
      }
    } catch (err) {
      update("Insert & read short", "fail", String(err));
    }

    // Test 5: Script generation endpoint reachable
    update("Script generate endpoint", "running");
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      // Expect 400 (missing fields) — that proves the route is live
      if (res.status === 400) {
        update("Script generate endpoint", "pass", "Route responds (400 for missing fields)");
      } else {
        update("Script generate endpoint", "fail", `Unexpected status: ${res.status}`);
      }
    } catch (err) {
      update("Script generate endpoint", "fail", String(err));
    }

    setRunning(false);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Test Harness</h1>
        <p className="text-gray-400 text-sm mb-6">
          Temporary — delete before Sprint E
        </p>

        <button
          onClick={runTests}
          disabled={running}
          className="px-6 py-2.5 bg-[#C0272D] hover:bg-[#a02025] text-white rounded-lg font-medium disabled:opacity-50 mb-8"
        >
          {running ? "Running..." : "Run All Tests"}
        </button>

        {results.length > 0 && (
          <ul className="space-y-3">
            {results.map((r) => (
              <li
                key={r.name}
                className="bg-gray-900 rounded-lg px-4 py-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.name}</span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded ${
                      r.status === "pass"
                        ? "bg-green-900 text-green-300"
                        : r.status === "fail"
                          ? "bg-red-900 text-red-300"
                          : "bg-yellow-900 text-yellow-300"
                    }`}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </div>
                {r.detail && (
                  <p className="text-xs text-gray-500 break-all">{r.detail}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
