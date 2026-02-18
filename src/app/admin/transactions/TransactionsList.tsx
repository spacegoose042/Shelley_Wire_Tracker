"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Transaction = {
  id: string;
  jobName: string;
  processed: boolean;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  lines: { partNumber: string; description: string | null; location: string; unit: string; quantity: number }[];
};

type UserOption = { id: string; email: string; name: string | null };

export function TransactionsList() {
  const [data, setData] = useState<{ transactions: Transaction[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [processedFilter, setProcessedFilter] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [job, setJob] = useState("");
  const [partNumber, setPartNumber] = useState("");

  const fetchTransactions = useCallback(() => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (processedFilter === "true" || processedFilter === "false") params.set("processed", processedFilter);
    if (userId) params.set("userId", userId);
    if (job.trim()) params.set("job", job.trim());
    if (partNumber.trim()) params.set("partNumber", partNumber.trim());
    setLoading(true);
    fetch(`/api/admin/transactions?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ transactions: [], total: 0 }))
      .finally(() => setLoading(false));
  }, [processedFilter, userId, job, partNumber]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((list) => setUsers(Array.isArray(list) ? list : []))
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  async function setProcessed(txId: string, value: boolean) {
    const res = await fetch(`/api/admin/transactions/${txId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ processed: value }),
    });
    if (!res.ok) return;
    setData((prev) =>
      prev
        ? {
            ...prev,
            transactions: prev.transactions.map((t) =>
              t.id === txId ? { ...t, processed: value } : t
            ),
          }
        : null
    );
  }

  if (loading && !data) return <p className="text-shelley-gray">Loading…</p>;
  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-shelley-gray">Processed</label>
          <select
            value={processedFilter}
            onChange={(e) => setProcessedFilter(e.target.value)}
            className="input-field min-w-[140px]"
          >
            <option value="">All</option>
            <option value="true">Processed</option>
            <option value="false">Not processed</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-shelley-gray">User</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-field min-w-[180px]"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-shelley-gray">Job</label>
          <input
            type="text"
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="Filter by job name"
            className="input-field min-w-[160px]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-shelley-gray">Part number</label>
          <input
            type="text"
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value)}
            placeholder="Filter by part"
            className="input-field min-w-[160px]"
          />
        </div>
      </div>

      <p className="text-sm text-shelley-gray">
        Showing {transactions.length} of {total} transaction{total !== 1 ? "s" : ""}
      </p>

      {transactions.length === 0 ? (
        <div className="card text-center text-shelley-gray">
          No transactions match the filters.
        </div>
      ) : (
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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                  Processed
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
                          {l.partNumber}
                          {l.location ? ` (${l.location})` : ""} – {l.quantity} {l.unit === "FEET" ? "ft" : "ea"}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={t.processed ? "true" : "false"}
                      onChange={(e) => setProcessed(t.id, e.target.value === "true")}
                      className={
                        t.processed
                          ? "input-field text-sm border-green-500 bg-green-50 text-green-800 font-medium"
                          : "input-field text-sm"
                      }
                      aria-label="Mark as processed or not"
                    >
                      <option value="false">Not processed</option>
                      <option value="true">Processed</option>
                    </select>
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
      )}
    </div>
  );
}
