"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Receipt = {
  id: string;
  partNumber: string;
  description: string | null;
  location: string;
  unit: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  receivedBy: string | null;
  receivedById: string | null;
};

type User = { id: string; name: string | null; email: string };

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReceiptsList() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [partNumber, setPartNumber] = useState("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchReceipts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (partNumber) params.set("partNumber", partNumber);
    if (userId) params.set("userId", userId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/admin/receipts?${params}`)
      .then((r) => r.json())
      .then((d) => setReceipts(Array.isArray(d) ? d : []))
      .catch(() => setReceipts([]))
      .finally(() => setLoading(false));
  }, [partNumber, userId, from, to]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const totalQtyByUnit = receipts.reduce<Record<string, number>>((acc, r) => {
    const label = r.unit === "FEET" ? "ft" : "ea";
    acc[label] = (acc[label] ?? 0) + r.quantity;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card flex flex-wrap gap-3 p-4">
        <div className="flex-1 min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-shelley-gray uppercase">Part number</label>
          <input
            type="text"
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value)}
            placeholder="e.g. 100-00001"
            className="input-field text-sm"
          />
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-shelley-gray uppercase">Received by</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-field text-sm"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-shelley-gray uppercase">From date</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input-field text-sm"
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-shelley-gray uppercase">To date</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input-field text-sm"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => { setPartNumber(""); setUserId(""); setFrom(""); setTo(""); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-shelley-gray hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && receipts.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm text-shelley-gray">
          <span>
            <strong className="text-shelley-blue">{receipts.length}</strong> receipt{receipts.length !== 1 ? "s" : ""}
          </span>
          {Object.entries(totalQtyByUnit).map(([unit, qty]) => (
            <span key={unit}>
              Total received: <strong className="text-shelley-blue">{qty} {unit}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-shelley-gray">Loading receipts…</p>
      ) : receipts.length === 0 ? (
        <div className="card text-center text-shelley-gray">No receipts found.</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Part number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Location</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-shelley-gray">Qty received</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Received by</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-shelley-gray">
                      {fmt(r.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/admin/receive?q=${encodeURIComponent(r.partNumber)}`}
                        className="font-medium text-shelley-blue hover:underline"
                      >
                        {r.partNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-shelley-gray">{r.description || "—"}</td>
                    <td className="px-4 py-3 text-sm text-shelley-gray">{r.location || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-shelley-blue">
                      +{r.quantity} {r.unit === "FEET" ? "ft" : "ea"}
                    </td>
                    <td className="px-4 py-3 text-sm text-shelley-gray">{r.receivedBy ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-shelley-gray">{r.notes || "—"}</td>
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
