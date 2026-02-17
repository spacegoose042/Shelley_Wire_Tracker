"use client";

import { useState } from "react";

export default function SetupPage() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSetup() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/setup");
      const data = await res.json().catch(() => ({ error: "Invalid response" }));
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setResult("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold text-gray-800">One-time setup</h1>
        <p className="mb-4 text-sm text-gray-600">
          Click the button to create the admin user (deb@shelleyelectric.com) if the database is empty.
        </p>
        <button
          type="button"
          onClick={runSetup}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Running…" : "Create admin user"}
        </button>
        {result && (
          <pre className="mt-4 overflow-auto rounded border border-gray-200 bg-gray-50 p-3 text-left text-sm">
            {result}
          </pre>
        )}
      </div>
    </div>
  );
}
