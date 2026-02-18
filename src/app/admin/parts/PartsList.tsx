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

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/parts")
      .then((r) => r.json())
      .then((data) => setParts(Array.isArray(data) ? data : []))
      .catch(() => setParts([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

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
                Edit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {parts.map((p) => (
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
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link
                    href={`/admin/parts/${p.id}`}
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
  );
}
