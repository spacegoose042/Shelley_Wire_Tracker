"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Transaction = {
  id: string;
  jobName: string;
  createdAt: string;
  user: { email: string; name: string | null };
  lines: { partNumber: string; description: string | null; unit: string; quantity: number }[];
};

export function TransactionsList() {
  const [data, setData] = useState<{ transactions: Transaction[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/transactions?limit=100")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ transactions: [], total: 0 }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-shelley-gray">Loading…</p>;
  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;

  if (transactions.length === 0)
    return (
      <div className="card text-center text-shelley-gray">
        No transactions yet.
      </div>
    );

  return (
    <div className="space-y-4">
      <p className="text-sm text-shelley-gray">Showing latest {transactions.length} of {total}</p>
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                  Date / time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                  Job
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                  Parts
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-shelley-gray">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-shelley-gray">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {t.user.name ?? t.user.email}
                  </td>
                  <td className="px-4 py-3 font-medium text-shelley-blue">{t.jobName}</td>
                  <td className="px-4 py-3 text-sm">
                    <ul className="list-inside list-disc space-y-0.5">
                      {t.lines.map((l, i) => (
                        <li key={i}>
                          {l.partNumber} – {l.quantity} {l.unit === "FEET" ? "ft" : "ea"}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      href={`/admin/transactions/${t.id}`}
                      className="text-sm text-shelley-blue hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
