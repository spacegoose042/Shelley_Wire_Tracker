"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Transaction = {
  id: string;
  jobName: string;
  createdAt: string;
  lines: { partNumber: string; description: string | null; location: string; unit: string; quantity: number }[];
};

export default function MyPullsPage() {
  const [data, setData] = useState<{ transactions: Transaction[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/my-transactions?limit=100")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ transactions: [], total: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-shelley-gray hover:text-shelley-blue"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-shelley-blue">My pulls</h1>
          <p className="mt-1 text-shelley-gray">History of your recorded pulls.</p>
        </div>
      </div>

      {loading && <p className="text-shelley-gray">Loading…</p>}
      {!loading && data && data.transactions.length === 0 && (
        <div className="card text-center text-shelley-gray">
          No pulls yet.{" "}
          <Link href="/pull" className="text-shelley-blue hover:underline">
            Record a pull
          </Link>
        </div>
      )}
      {!loading && data && data.transactions.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                    Date / time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                    Job
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                    Parts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-shelley-gray">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-shelley-blue">{t.jobName}</td>
                    <td className="px-4 py-3 text-sm">
                      <ul className="list-inside list-disc space-y-0.5">
                        {t.lines.map((l, i) => (
                          <li key={i}>
                            {l.partNumber}
                            {l.location ? ` (${l.location})` : ""} – {l.quantity} {l.unit === "FEET" ? "ft" : "ea"}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.total > data.transactions.length && (
            <p className="border-t border-gray-200 px-4 py-2 text-sm text-shelley-gray">
              Showing latest {data.transactions.length} of {data.total}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
