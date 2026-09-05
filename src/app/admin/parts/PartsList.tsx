"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReceiptLabelButton } from "@/components/ReceiptLabelButton";

type Part = {
  id: string;
  partNumber: string;
  description: string | null;
  location: string;
  unit: string;
  currentQuantity: number;
  archived: boolean;
  archivedAt: string | null;
  jobWorkOrders: string[];
  labelJobs: { number: string; quantity: number }[];
};

type PartGroup = {
  partNumber: string;
  description: string | null;
  unit: string;
  totalQuantity: number;
  locations: Part[];
  jobWorkOrders: string[];
};

function groupParts(parts: Part[]): PartGroup[] {
  const map = new Map<string, PartGroup>();
  for (const p of parts) {
    const jobs = p.jobWorkOrders ?? [];
    const existing = map.get(p.partNumber);
    if (existing) {
      existing.totalQuantity += p.currentQuantity;
      existing.locations.push(p);
      for (const job of jobs) {
        if (!existing.jobWorkOrders.includes(job)) existing.jobWorkOrders.push(job);
      }
    } else {
      map.set(p.partNumber, {
        partNumber: p.partNumber,
        description: p.description,
        unit: p.unit,
        totalQuantity: p.currentQuantity,
        locations: [p],
        jobWorkOrders: [...jobs],
      });
    }
  }
  return Array.from(map.values());
}

function JobWorkOrderChips({ jobs, limit = 3 }: { jobs: string[]; limit?: number }) {
  if (jobs.length === 0) return <span className="text-shelley-gray">—</span>;
  const shown = jobs.slice(0, limit);
  const hidden = jobs.length - shown.length;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((job) => (
        <span
          key={job}
          className="rounded-md bg-shelley-blue/10 px-2 py-0.5 text-xs font-medium text-shelley-blue"
        >
          {job}
        </span>
      ))}
      {hidden > 0 && (
        <span className="text-xs text-shelley-gray" title={jobs.join(", ")}>
          +{hidden} more
        </span>
      )}
    </span>
  );
}

export function PartsList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [jobFilter, setJobFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const url = showArchived ? "/api/admin/parts?includeArchived=true" : "/api/admin/parts";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setParts(Array.isArray(data) ? data : []))
      .catch(() => setParts([]))
      .finally(() => setLoading(false));
  }, [refreshKey, showArchived]);

  function toggle(partNumber: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(partNumber)) next.delete(partNumber);
      else next.add(partNumber);
      return next;
    });
  }

  const archivedCount = parts.filter((p) => p.archived).length;

  if (loading) return <p className="text-shelley-gray">Loading parts…</p>;

  const allGroups = groupParts(parts);

  if (allGroups.length === 0)
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="text-sm text-shelley-gray hover:text-shelley-blue"
          >
            {showArchived ? "Hide archived" : `Show archived${archivedCount > 0 ? ` (${archivedCount})` : ""}`}
          </button>
        </div>
        <div className="card text-center text-shelley-gray">
          No parts yet. Go to Receive inventory to add one.
        </div>
      </div>
    );

  const jobQuery = jobFilter.trim().toLowerCase();
  const groups = jobQuery
    ? allGroups.filter((g) =>
        g.jobWorkOrders.some((job) => job.toLowerCase().includes(jobQuery))
      )
    : allGroups;

  const archivedGroupCount = groups.filter((g) => g.locations.every((l) => l.archived)).length;

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <label className="mb-1 block text-xs font-medium uppercase text-shelley-gray">
          Job/WO number
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            placeholder="Filter parts by Job/WO — e.g. WO-5678"
            className="input-field max-w-sm flex-1 text-sm"
          />
          {jobFilter && (
            <button
              onClick={() => setJobFilter("")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-shelley-gray hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-shelley-gray">
          {groups.length} part{groups.length !== 1 ? "s" : ""}
          {jobQuery && <span className="ml-1">matching &ldquo;{jobFilter.trim()}&rdquo;</span>}
          {archivedGroupCount > 0 && showArchived && (
            <span className="ml-2 text-amber-600">({archivedGroupCount} archived)</span>
          )}
        </p>
        <button
          onClick={() => setShowArchived((v) => !v)}
          className="text-sm text-shelley-gray hover:text-shelley-blue"
        >
          {showArchived
            ? "Hide archived"
            : archivedCount > 0
            ? `Show archived (${archivedCount})`
            : "Show archived"}
        </button>
      </div>

    {groups.length === 0 ? (
      <div className="card text-center text-shelley-gray">
        No parts are associated with a Job/WO matching &ldquo;{jobFilter.trim()}&rdquo;.
      </div>
    ) : (
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
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                Job/WO
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
              const ul = g.unit === "FEET" ? "ft" : "ea";
              const allArchived = g.locations.every((l) => l.archived);
              const activeQty = g.locations
                .filter((l) => !l.archived)
                .reduce((s, l) => s + l.currentQuantity, 0);
              const displayQty = allArchived ? g.totalQuantity : activeQty;
              const isLow = displayQty === 0 && !allArchived;

              return (
                <>
                  {/* Summary row */}
                  <tr
                    key={g.partNumber}
                    className={`divide-y divide-gray-200 border-t border-gray-200 cursor-pointer transition-colors ${
                      allArchived
                        ? "opacity-50 hover:opacity-70"
                        : isOpen
                        ? "bg-shelley-blue/5 hover:bg-shelley-blue/5"
                        : "hover:bg-shelley-blue/5"
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
                      {allArchived && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-shelley-gray">{g.description || "—"}</td>
                    <td className="px-4 py-3 text-sm text-shelley-gray">
                      {g.locations.length === 1
                        ? g.locations[0].location || "No location"
                        : `${g.locations.length} locations`}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <JobWorkOrderChips jobs={g.jobWorkOrders} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <span className={`font-semibold ${isLow ? "text-shelley-red" : allArchived ? "text-shelley-gray" : "text-shelley-blue"}`}>
                        {displayQty} {ul}
                      </span>
                      {isLow && (
                        <span className="ml-2 rounded-full bg-shelley-red/10 px-2 py-0.5 text-xs font-medium text-shelley-red">
                          Out of stock
                        </span>
                      )}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {g.locations.length === 1 && (
                        <ReceiptLabelButton
                          partNumber={g.partNumber}
                          jobOptions={g.locations[0].labelJobs ?? []}
                          unit={g.unit}
                        />
                      )}
                    </td>
                  </tr>

                  {/* Expanded location rows */}
                  {isOpen &&
                    g.locations.map((loc) => (
                      <tr
                        key={loc.id}
                        className={`border-t border-gray-100 ${loc.archived ? "opacity-50 bg-amber-50/30" : "bg-shelley-blue/[0.03]"}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <td className="px-3 py-2" />
                        <td className="px-4 py-2 pl-8 text-xs text-shelley-gray" />
                        <td className="px-4 py-2 text-xs text-shelley-gray" />
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-shelley-gray">
                            📍 {loc.location || "No location set"}
                          </span>
                          {loc.archived && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Archived
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <JobWorkOrderChips jobs={loc.jobWorkOrders ?? []} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-right text-sm">
                          <span className={loc.currentQuantity === 0 ? "text-shelley-red font-medium" : "font-medium text-shelley-blue"}>
                            {loc.currentQuantity} {ul}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <ReceiptLabelButton
                              partNumber={g.partNumber}
                              jobOptions={loc.labelJobs ?? []}
                              unit={g.unit}
                            />
                            <Link
                              href={`/admin/parts/${loc.id}`}
                              className="text-xs text-shelley-blue hover:underline"
                            >
                              {loc.archived ? "View / Unarchive" : "Edit"}
                            </Link>
                          </div>
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
    )}
    </div>
  );
}
