"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PartOption = {
  id: string;
  partNumber: string;
  description: string | null;
  location: string;
  unit: string;
  currentQuantity: number;
};

type LineRow = {
  partId: string;
  partNumber: string;
  location: string;
  unit: string;
  quantity: string;
};

// Represents one inventory movement that needs a location decision
type AdjustmentItem = {
  key: string;
  // return: qty being put back; pull-extra: more qty needed on existing line; pull-auto: brand-new line
  type: "return" | "pull-extra" | "pull-auto";
  partNumber: string;
  description: string | null;
  unit: string;
  quantity: number; // always positive
  selectedPartId: string; // user-editable for return/pull-extra
  availableLocations: PartOption[];
};

type Initial = {
  id: string;
  jobName: string;
  createdAt: string;
  user: { email: string; name: string | null };
  lines: {
    id: string;
    partId: string;
    partNumber: string;
    description: string | null;
    location: string;
    unit: string;
    quantity: number;
  }[];
};

function unitLabel(unit: string) {
  return unit === "FEET" ? "ft" : "ea";
}

export function EditTransactionForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [jobName, setJobName] = useState(initial.jobName);
  const [lines, setLines] = useState<LineRow[]>(
    initial.lines.map((l) => ({
      partId: l.partId,
      partNumber: l.partNumber,
      location: l.location,
      unit: l.unit,
      quantity: String(l.quantity),
    }))
  );
  const [parts, setParts] = useState<PartOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"editing" | "reviewing">("editing");
  const [adjustments, setAdjustments] = useState<AdjustmentItem[]>([]);

  useEffect(() => {
    fetch("/api/admin/parts")
      .then((r) => r.json())
      .then((data) => setParts(Array.isArray(data) ? data : []))
      .catch(() => setParts([]));
  }, []);

  function addLine() {
    if (parts.length === 0) return;
    const first = parts[0];
    setLines((prev) => [
      ...prev,
      { partId: first.id, partNumber: first.partNumber, location: first.location, unit: first.unit, quantity: "" },
    ]);
  }

  function setLinePart(index: number, part: PartOption) {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], partId: part.id, partNumber: part.partNumber, location: part.location, unit: part.unit };
      return next;
    });
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  // Build partId→qty maps for original and new lines
  function buildMap(src: { partId: string; quantity: number | string }[]) {
    const m = new Map<string, number>();
    for (const l of src) {
      const qty = typeof l.quantity === "string" ? Number(l.quantity) : l.quantity;
      if (l.partId && qty > 0) m.set(l.partId, (m.get(l.partId) ?? 0) + qty);
    }
    return m;
  }

  function linesChanged(): boolean {
    const origMap = buildMap(initial.lines);
    const newMap = buildMap(lines);
    if (origMap.size !== newMap.size) return true;
    for (const [pid, qty] of Array.from(origMap)) {
      if (newMap.get(pid) !== qty) return true;
    }
    return false;
  }

  function computeAdjustments(): AdjustmentItem[] {
    const origMap = buildMap(initial.lines);
    const newMap = buildMap(lines);
    const allIds = Array.from(new Set(Array.from(origMap.keys()).concat(Array.from(newMap.keys()))));
    const items: AdjustmentItem[] = [];

    for (const partId of allIds) {
      const oldQty = origMap.get(partId) ?? 0;
      const newQty = newMap.get(partId) ?? 0;
      const delta = newQty - oldQty;
      if (delta === 0) continue;

      const part = parts.find((p) => p.id === partId);
      if (!part) continue;

      const locs = parts.filter((p) => p.partNumber === part.partNumber);

      if (delta < 0) {
        items.push({
          key: `return-${partId}`,
          type: "return",
          partNumber: part.partNumber,
          description: part.description,
          unit: part.unit,
          quantity: -delta,
          selectedPartId: partId,
          availableLocations: locs,
        });
      } else if (oldQty > 0) {
        // Quantity increased on an existing line
        items.push({
          key: `pull-extra-${partId}`,
          type: "pull-extra",
          partNumber: part.partNumber,
          description: part.description,
          unit: part.unit,
          quantity: delta,
          selectedPartId: partId,
          availableLocations: locs,
        });
      } else {
        // Brand-new line — location already chosen in the part dropdown
        items.push({
          key: `pull-auto-${partId}`,
          type: "pull-auto",
          partNumber: part.partNumber,
          description: part.description,
          unit: part.unit,
          quantity: delta,
          selectedPartId: partId,
          availableLocations: locs,
        });
      }
    }
    return items;
  }

  // Called when the user clicks the primary button on the edit form
  function handleReviewOrSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedJob = jobName.trim();
    if (!trimmedJob) { setError("Job name is required."); return; }

    const validLines = lines.filter((l) => l.partId && Number(l.quantity) > 0);
    if (validLines.length === 0) { setError("Add at least one part with a quantity."); return; }

    if (!linesChanged()) {
      // Only metadata changed — save without touching inventory
      submitPatch({ jobName: trimmedJob });
      return;
    }

    setAdjustments(computeAdjustments());
    setStage("reviewing");
  }

  async function submitPatch(body: object) {
    setLoading(true);
    const res = await fetch(`/api/admin/transactions/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to update.");
      setStage("editing");
      return;
    }
    router.push("/admin/transactions");
    router.refresh();
  }

  async function handleFinalSubmit() {
    setError("");
    const trimmedJob = jobName.trim();
    const newLines = lines
      .filter((l) => l.partId && Number(l.quantity) > 0)
      .map((l) => ({ partId: l.partId, quantity: Number(l.quantity) }));

    const inventoryAdjustments = adjustments.map((adj) => ({
      partId: adj.selectedPartId,
      delta: adj.type === "return" ? adj.quantity : -adj.quantity,
    }));

    submitPatch({ jobName: trimmedJob, lines: newLines, inventoryAdjustments });
  }

  function updateAdjustmentLocation(key: string, selectedPartId: string) {
    setAdjustments((prev) =>
      prev.map((a) => (a.key === key ? { ...a, selectedPartId } : a))
    );
  }

  // ── REVIEW STAGE ────────────────────────────────────────────────────────────
  if (stage === "reviewing") {
    const returns = adjustments.filter((a) => a.type === "return");
    const extras = adjustments.filter((a) => a.type === "pull-extra");
    const autos = adjustments.filter((a) => a.type === "pull-auto");

    return (
      <div className="card max-w-3xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-shelley-blue">Review inventory changes</h2>
          <p className="mt-1 text-sm text-shelley-gray">
            Choose where returned stock should go and where extra pulls should come from, then save.
          </p>
        </div>

        {/* Returns */}
        {returns.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
              ↩ Stock being returned to inventory
            </h3>
            {returns.map((adj) => (
              <div key={adj.key} className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div>
                  <p className="font-medium text-shelley-blue">
                    {adj.quantity} {unitLabel(adj.unit)} of {adj.partNumber}
                  </p>
                  {adj.description && <p className="text-xs text-shelley-gray">{adj.description}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-shelley-gray">
                    Return to location <span className="text-shelley-red">*</span>
                  </label>
                  {adj.availableLocations.length === 1 ? (
                    <p className="text-sm font-medium text-shelley-blue">
                      {adj.availableLocations[0].location || "No location set"}
                    </p>
                  ) : (
                    <select
                      value={adj.selectedPartId}
                      onChange={(e) => updateAdjustmentLocation(adj.key, e.target.value)}
                      className="input-field"
                    >
                      {adj.availableLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.location || "No location set"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Extra pulls */}
        {extras.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-shelley-blue">
              ↑ Additional stock being pulled
            </h3>
            {extras.map((adj) => (
              <div key={adj.key} className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                <div>
                  <p className="font-medium text-shelley-blue">
                    +{adj.quantity} {unitLabel(adj.unit)} of {adj.partNumber}
                  </p>
                  {adj.description && <p className="text-xs text-shelley-gray">{adj.description}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-shelley-gray">
                    Pull from location <span className="text-shelley-red">*</span>
                  </label>
                  {adj.availableLocations.length === 1 ? (
                    <p className="text-sm font-medium text-shelley-blue">
                      {adj.availableLocations[0].location || "No location set"}{" "}
                      <span className="text-shelley-gray font-normal">
                        (on hand: {adj.availableLocations[0].currentQuantity} {unitLabel(adj.unit)})
                      </span>
                    </p>
                  ) : (
                    <select
                      value={adj.selectedPartId}
                      onChange={(e) => updateAdjustmentLocation(adj.key, e.target.value)}
                      className="input-field"
                    >
                      {adj.availableLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.location || "No location set"} — on hand:{" "}
                          {loc.currentQuantity} {unitLabel(loc.unit)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Automatic new-line pulls — informational only */}
        {autos.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-green-700">
              ↓ New lines being pulled
            </h3>
            {autos.map((adj) => {
              const loc = adj.availableLocations.find((l) => l.id === adj.selectedPartId);
              return (
                <div key={adj.key} className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="font-medium text-shelley-blue">
                    {adj.quantity} {unitLabel(adj.unit)} of {adj.partNumber}
                  </p>
                  {adj.description && <p className="text-xs text-shelley-gray">{adj.description}</p>}
                  <p className="mt-1 text-sm text-shelley-gray">
                    From: <strong className="text-shelley-blue">{loc?.location || "—"}</strong>
                  </p>
                </div>
              );
            })}
          </section>
        )}

        {error && <p className="text-sm text-shelley-red">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleFinalSubmit}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => { setStage("editing"); setError(""); }}
            className="btn-secondary"
          >
            Back to edit
          </button>
        </div>
      </div>
    );
  }

  // ── EDITING STAGE ────────────────────────────────────────────────────────────
  return (
    <div className="card max-w-3xl">
      <form onSubmit={handleReviewOrSave} className="space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-shelley-gray">Job name</label>
          <input
            type="text"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-shelley-gray">Parts</label>
            <button type="button" onClick={addLine} className="btn-secondary text-sm">
              Add line
            </button>
          </div>
          <div className="space-y-3">
            {lines.map((line, index) => {
              const orig = initial.lines.find((l) => l.partId === line.partId);
              const origQty = orig?.quantity ?? null;
              const newQty = Number(line.quantity);
              const changed = origQty !== null && newQty !== origQty;

              return (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3"
                >
                  <div className="min-w-[200px] flex-1">
                    <select
                      value={line.partId}
                      onChange={(e) => {
                        const part = parts.find((p) => p.id === e.target.value);
                        if (part) setLinePart(index, part);
                      }}
                      className="input-field"
                    >
                      {parts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.partNumber}
                          {p.location ? ` (${p.location})` : ""} — on hand: {p.currentQuantity}{" "}
                          {unitLabel(p.unit)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28 flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.quantity}
                      onChange={(e) =>
                        setLines((prev) => {
                          const next = [...prev];
                          next[index] = { ...next[index], quantity: e.target.value };
                          return next;
                        })
                      }
                      className={`input-field ${changed ? "border-amber-400 bg-amber-50" : ""}`}
                      placeholder={unitLabel(line.unit)}
                    />
                    <span className="text-sm text-shelley-gray">{unitLabel(line.unit)}</span>
                  </div>
                  {changed && origQty !== null && (
                    <span className="text-xs text-amber-600">
                      was {origQty}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="text-shelley-red hover:underline text-sm"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-shelley-red">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving…" : linesChanged() ? "Review changes →" : "Save changes"}
          </button>
          <Link href="/admin/transactions" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
