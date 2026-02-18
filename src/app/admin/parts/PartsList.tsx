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

type PartGroup = {
  partNumber: string;
  description: string | null;
  unit: string;
  totalQuantity: number;
  locations: Part[];
};

function groupParts(parts: Part[]): PartGroup[] {
  const map = new Map<string, PartGroup>();
  for (const p of parts) {
    const existing = map.get(p.partNumber);
    if (existing) {
      existing.totalQuantity += p.currentQuantity;
      existing.locations.push(p);
    } else {
      map.set(p.partNumber, {
        partNumber: p.partNumber,
        description: p.description,
        unit: p.unit,
        totalQuantity: p.currentQuantity,
        locations: [p],
      });
    }
  }
  return Array.from(map.values());
}

export function PartsList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/parts")
      .then((r) => r.json())
      .then((data) => setParts(Array.isArray(data) ? data : []))
      .catch(() => setParts([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function toggle(partNumber: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(partNumber)) next.delete(partNumber);
      else next.add(partNumber);
      return next;
    });
  }

  if (loading) return <p className="text-shelley-gray">Loading parts…</p>;
  if (parts.length === 0)
    return (
      <div className="card text-center text-shelley-gray">
        No parts yet. Go to Receive inventory to add one.
      </div>
    );

  const groups = groupParts(parts);

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-3 py-3" />
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                Part number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                Locations
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-shelley-gray">
                Total on hand
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-shelley-gray">
                {/* actions */}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {groups.map((g) => {
              const isOpen = expanded.has(g.partNumber);
              const unitLabel = g.unit === "FEET" ? "ft" : "ea";
              const isLow = g.totalQuantity === 0;

              return (
                <>
                  {/* Summary row */}
                  <tr
                    key={g.partNumber}
                    className={`divide-y divide-gray-200 border-t border-gray-200 cursor-pointer hover:bg-shelley-blue/5 transition-colors ${
                      isOpen ? "bg-shelley-blue/5" : ""
                    }`}
                    onClick={() => toggle(g.partNumber)}
                  >
                    <td className="px-3 py-3 text-center text-shelley-gray select-none">
                      <span className="inline-block transition-transform duration-200" style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                        ▶
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-shelley-blue">
                      {g.partNumber}
                    </td>
                    <td className="px-4 py-3 text-shelley-gray">{g.description || "—"}</td>
                    <td className="px-4 py-3 text-sm text-shelley-gray">
                      {g.locations.length === 1
                        ? g.locations[0].location || "No location"
                        : `${g.locations.length} locations`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <span className={`font-semibold ${isLow ? "text-shelley-red" : "text-shelley-blue"}`}>
                        {g.totalQuantity} {unitLabel}
                      </span>
                      {isLow && (
                        <span className="ml-2 rounded-full bg-shelley-red/10 px-2 py-0.5 text-xs font-medium text-shelley-red">
                          Out of stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>

                  {/* Expanded location rows */}
                  {isOpen &&
                    g.locations.map((loc) => (
                      <tr
                        key={loc.id}
                        className="border-t border-gray-100 bg-shelley-blue/[0.03]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <td className="px-3 py-2" />
                        <td className="px-4 py-2 pl-8 text-xs text-shelley-gray" />
                        <td className="px-4 py-2 text-xs text-shelley-gray" />
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-shelley-gray">
                            📍 {loc.location || "No location set"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-right text-sm">
                          <span className={loc.currentQuantity === 0 ? "text-shelley-red font-medium" : "font-medium text-shelley-blue"}>
                            {loc.currentQuantity} {unitLabel}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-right">
                          <Link
                            href={`/admin/parts/${loc.id}`}
                            className="text-xs text-shelley-blue hover:underline"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
