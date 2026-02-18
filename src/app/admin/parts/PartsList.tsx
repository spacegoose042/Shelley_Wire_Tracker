"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Part = {
  id: string;
  partNumber: string;
  description: string | null;
  location: string;
  unit: string;
  currentQuantity: number;
};

export function PartsList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [receiveQty, setReceiveQty] = useState("");
  const [receiveError, setReceiveError] = useState("");
  const [receiveSaving, setReceiveSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/parts")
      .then((r) => r.json())
      .then((data) => setParts(Array.isArray(data) ? data : []))
      .catch(() => setParts([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function openReceive(id: string) {
    setReceivingId(id);
    setReceiveQty("");
    setReceiveError("");
  }

  function cancelReceive() {
    setReceivingId(null);
    setReceiveQty("");
    setReceiveError("");
  }

  async function submitReceive(part: Part) {
    const qty = Number(receiveQty);
    if (!receiveQty || isNaN(qty) || qty <= 0) {
      setReceiveError("Enter a positive quantity.");
      return;
    }
    setReceiveSaving(true);
    setReceiveError("");
    const res = await fetch(`/api/parts/${part.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addQuantity: qty }),
    });
    const data = await res.json().catch(() => ({}));
    setReceiveSaving(false);
    if (!res.ok) {
      setReceiveError(data.error ?? "Failed to update.");
      return;
    }
    setParts((prev) =>
      prev.map((p) => (p.id === part.id ? { ...p, currentQuantity: data.currentQuantity } : p))
    );
    setReceivingId(null);
    setReceiveQty("");
  }

  if (loading) return <p className="text-shelley-gray">Loading parts…</p>;
  if (parts.length === 0)
    return (
      <div className="card text-center text-shelley-gray">
        No parts yet. Add one above.
      </div>
    );

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                Part number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                Unit
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-shelley-gray">
                On hand
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-shelley-gray">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {parts.map((p) => (
              <>
                <tr key={p.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-shelley-blue">
                    {p.partNumber}
                  </td>
                  <td className="px-4 py-3 text-shelley-gray">{p.description || "—"}</td>
                  <td className="px-4 py-3 text-shelley-gray">{p.location || "—"}</td>
                  <td className="px-4 py-3 text-shelley-gray">{p.unit === "FEET" ? "ft" : "ea"}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {p.currentQuantity} {p.unit === "FEET" ? "ft" : "ea"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right space-x-3">
                    <button
                      type="button"
                      onClick={() => receivingId === p.id ? cancelReceive() : openReceive(p.id)}
                      className="text-sm text-green-700 hover:underline font-medium"
                    >
                      {receivingId === p.id ? "Cancel" : "Receive"}
                    </button>
                    <Link
                      href={`/admin/parts/${p.id}`}
                      className="text-sm text-shelley-blue hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
                {receivingId === p.id && (
                  <tr key={`${p.id}-receive`} className="bg-green-50">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-green-800">
                          Receive stock for {p.partNumber}
                          {p.location ? ` (${p.location})` : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={receiveQty}
                            onChange={(e) => setReceiveQty(e.target.value)}
                            placeholder={`Qty to add (${p.unit === "FEET" ? "ft" : "ea"})`}
                            className="input-field w-48"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submitReceive(p);
                              if (e.key === "Escape") cancelReceive();
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => submitReceive(p)}
                            disabled={receiveSaving}
                            className="btn-primary text-sm"
                          >
                            {receiveSaving ? "Saving…" : "Add to inventory"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelReceive}
                            className="btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                        {receiveError && (
                          <span className="text-sm text-shelley-red">{receiveError}</span>
                        )}
                        <span className="text-xs text-shelley-gray">
                          Current: {p.currentQuantity} {p.unit === "FEET" ? "ft" : "ea"}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
