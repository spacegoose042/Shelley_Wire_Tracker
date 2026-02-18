"use client";

import { useEffect, useState } from "react";

type Receipt = {
  id: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  receivedBy: string | null;
};

export function ReceiptHistory({ partId, unit }: { partId: string; unit: string }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/parts/${partId}/receipts`)
      .then((r) => r.json())
      .then((data) => setReceipts(Array.isArray(data) ? data : []))
      .catch(() => setReceipts([]))
      .finally(() => setLoading(false));
  }, [partId]);

  const unitLabel = unit === "FEET" ? "ft" : "ea";

  if (loading) return <p className="text-sm text-shelley-gray">Loading receipt history…</p>;

  return (
    <div className="card space-y-3">
      <h2 className="font-medium text-shelley-blue">Receipt history</h2>
      {receipts.length === 0 ? (
        <p className="text-sm text-shelley-gray">No receipts recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-shelley-gray">Date</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-shelley-gray">Qty received</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-shelley-gray">Received by</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-shelley-gray">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-shelley-gray">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-green-700">
                    +{r.quantity} {unitLabel}
                  </td>
                  <td className="px-3 py-2 text-shelley-gray">{r.receivedBy ?? "—"}</td>
                  <td className="px-3 py-2 text-shelley-gray">{r.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
