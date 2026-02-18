"use client";

import { useState, useEffect } from "react";

type Part = {
  id: string;
  partNumber: string;
  description: string | null;
  location: string;
  unit: string;
  currentQuantity: number;
};

type Stage =
  | { type: "idle" }
  | { type: "results"; query: string; parts: Part[] }
  | { type: "receiving"; part: Part; qty: string; saving: boolean; error: string }
  | { type: "done"; part: Part; added: number; newTotal: number }
  | { type: "create"; partNumber: string };

export function ReceiveInventory({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [stage, setStage] = useState<Stage>({ type: "idle" });

  // Create-form state
  const [createPartNumber, setCreatePartNumber] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createUnit, setCreateUnit] = useState<"FEET" | "EACH">("FEET");
  const [createQty, setCreateQty] = useState("");
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (initialQuery.trim()) {
      runSearch(initialQuery.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(q: string) {
    setSearching(true);
    const res = await fetch(`/api/admin/parts?q=${encodeURIComponent(q)}`);
    const data = await res.json().catch(() => []);
    setSearching(false);
    setStage({ type: "results", query: q, parts: Array.isArray(data) ? data : [] });
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    runSearch(q);
  }

  function startReceive(part: Part) {
    setStage({ type: "receiving", part, qty: "", saving: false, error: "" });
  }

  async function submitReceive() {
    if (stage.type !== "receiving") return;
    const qty = Number(stage.qty);
    if (!stage.qty || isNaN(qty) || qty <= 0) {
      setStage({ ...stage, error: "Enter a positive quantity." });
      return;
    }
    setStage({ ...stage, saving: true, error: "" });
    const res = await fetch(`/api/parts/${stage.part.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addQuantity: qty }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStage({ ...stage, saving: false, error: data.error ?? "Failed to save." });
      return;
    }
    setStage({ type: "done", part: stage.part, added: qty, newTotal: data.currentQuantity });
  }

  function openCreate(partNumber = "") {
    setCreatePartNumber(partNumber);
    setCreateDesc("");
    setCreateLocation("");
    setCreateUnit("FEET");
    setCreateQty("");
    setCreateError("");
    setStage({ type: "create", partNumber });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (stage.type !== "create") return;
    const pn = createPartNumber.trim();
    if (!pn) {
      setCreateError("Part number is required.");
      return;
    }
    const qty = parseFloat(createQty) || 0;
    if (qty < 0) {
      setCreateError("Quantity must be 0 or greater.");
      return;
    }
    setCreateSaving(true);
    setCreateError("");
    const res = await fetch("/api/admin/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partNumber: pn,
        description: createDesc.trim() || undefined,
        location: createLocation.trim() || undefined,
        unit: createUnit,
        currentQuantity: qty,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setCreateSaving(false);
    if (!res.ok) {
      setCreateError(data.error ?? "Failed to create part.");
      return;
    }
    setStage({ type: "done", part: data, added: qty, newTotal: data.currentQuantity });
  }

  function reset() {
    setQuery("");
    setStage({ type: "idle" });
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Two entry paths on idle — or show search bar at top when in results/receiving */}
      {(stage.type === "idle" || stage.type === "results") && (
        <div className="card space-y-5">
          {/* Path A: existing part */}
          <div>
            <h2 className="mb-1 font-medium text-shelley-blue">Receive stock for an existing part</h2>
            <p className="mb-3 text-sm text-shelley-gray">
              Search by part number to find the record, then enter how much was received.
            </p>
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Part number"
                className="input-field flex-1"
                autoFocus={!initialQuery}
              />
              <button type="submit" className="btn-primary whitespace-nowrap" disabled={searching}>
                {searching ? "Searching…" : "Look up"}
              </button>
            </form>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-shelley-gray">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Path B: new part */}
          <div>
            <h2 className="mb-1 font-medium text-shelley-blue">Enter a new part into the system</h2>
            <p className="mb-3 text-sm text-shelley-gray">
              Part number not in the system yet? Add it here.
            </p>
            <button
              type="button"
              onClick={() => openCreate("")}
              className="btn-secondary"
            >
              Create new part
            </button>
          </div>
        </div>
      )}

      {/* Search results */}
      {stage.type === "results" && (
        <div className="card space-y-4">
          {stage.parts.length > 0 ? (
            <>
              <h2 className="font-medium text-shelley-blue">
                Select the record to receive into
              </h2>
              <p className="text-sm text-shelley-gray">
                {stage.parts.length} record{stage.parts.length !== 1 ? "s" : ""} found matching &ldquo;{stage.query}&rdquo;
              </p>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                {stage.parts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 px-4 py-3 bg-white">
                    <div>
                      <p className="font-medium text-shelley-blue">
                        {p.partNumber}
                        {p.location ? (
                          <span className="ml-2 text-sm font-normal text-shelley-gray">
                            @ {p.location}
                          </span>
                        ) : null}
                      </p>
                      {p.description && (
                        <p className="text-sm text-shelley-gray">{p.description}</p>
                      )}
                      <p className="text-xs text-shelley-gray">
                        On hand: {p.currentQuantity} {p.unit === "FEET" ? "ft" : "ea"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startReceive(p)}
                      className="btn-primary text-sm whitespace-nowrap"
                    >
                      Receive into this
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-shelley-gray">
                Wrong location or a new stocking location for this part?{" "}
                <button
                  type="button"
                  className="text-shelley-blue hover:underline font-medium"
                  onClick={() => openCreate(stage.query)}
                >
                  Add &ldquo;{stage.query}&rdquo; at a new location
                </button>
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <h2 className="font-medium text-shelley-blue">No match found</h2>
              <p className="text-sm text-shelley-gray">
                &ldquo;{stage.query}&rdquo; is not in the system yet.
              </p>
              <button
                type="button"
                onClick={() => openCreate(stage.query)}
                className="btn-primary"
              >
                Create &ldquo;{stage.query}&rdquo; as a new part
              </button>
            </div>
          )}
        </div>
      )}

      {/* Receive qty input */}
      {stage.type === "receiving" && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-shelley-blue">Enter quantity received</h2>
            <button type="button" onClick={reset} className="text-sm text-shelley-gray hover:underline">
              Start over
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="font-medium text-shelley-blue">
              {stage.part.partNumber}
              {stage.part.location ? (
                <span className="ml-2 text-sm font-normal text-shelley-gray">
                  @ {stage.part.location}
                </span>
              ) : null}
            </p>
            {stage.part.description && (
              <p className="text-sm text-shelley-gray">{stage.part.description}</p>
            )}
            <p className="text-xs text-shelley-gray">
              Current on hand: {stage.part.currentQuantity}{" "}
              {stage.part.unit === "FEET" ? "ft" : "ea"}
            </p>
          </div>
          <div className="flex items-end gap-3">
            <div className="w-48">
              <label className="mb-1 block text-sm font-medium text-shelley-gray">
                Quantity received ({stage.part.unit === "FEET" ? "ft" : "ea"})
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={stage.qty}
                onChange={(e) => setStage({ ...stage, qty: e.target.value })}
                className="input-field"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") submitReceive(); }}
              />
            </div>
            <button
              type="button"
              onClick={submitReceive}
              disabled={stage.saving}
              className="btn-primary"
            >
              {stage.saving ? "Saving…" : "Add to inventory"}
            </button>
          </div>
          {stage.error && <p className="text-sm text-shelley-red">{stage.error}</p>}
        </div>
      )}

      {/* Create new part form */}
      {stage.type === "create" && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-shelley-blue">Enter new part into system</h2>
            <button type="button" onClick={reset} className="text-sm text-shelley-gray hover:underline">
              Start over
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1 block text-sm font-medium text-shelley-gray">
                  Part number <span className="text-shelley-red">*</span>
                </label>
                <input
                  type="text"
                  value={createPartNumber}
                  onChange={(e) => setCreatePartNumber(e.target.value)}
                  className="input-field"
                  required
                  autoFocus
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="mb-1 block text-sm font-medium text-shelley-gray">Description</label>
                <input
                  type="text"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1 block text-sm font-medium text-shelley-gray">Location</label>
                <input
                  type="text"
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Bay 1234"
                />
              </div>
              <div className="w-32">
                <label className="mb-1 block text-sm font-medium text-shelley-gray">Unit</label>
                <select
                  value={createUnit}
                  onChange={(e) => setCreateUnit(e.target.value as "FEET" | "EACH")}
                  className="input-field"
                >
                  <option value="FEET">Feet</option>
                  <option value="EACH">Each</option>
                </select>
              </div>
              <div className="w-36">
                <label className="mb-1 block text-sm font-medium text-shelley-gray">
                  Initial quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={createQty}
                  onChange={(e) => setCreateQty(e.target.value)}
                  className="input-field"
                  placeholder="0"
                />
              </div>
            </div>
            {createError && <p className="text-sm text-shelley-red">{createError}</p>}
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={createSaving}>
                {createSaving ? "Creating…" : "Save part"}
              </button>
              <button type="button" onClick={reset} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success */}
      {stage.type === "done" && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 text-xl font-bold">✓</span>
            <h2 className="font-medium text-green-800">Done</h2>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm space-y-0.5">
            <p className="font-medium text-shelley-blue">
              {stage.part.partNumber}
              {stage.part.location ? ` @ ${stage.part.location}` : ""}
            </p>
            {stage.part.description && (
              <p className="text-shelley-gray">{stage.part.description}</p>
            )}
            <p className="text-shelley-gray">
              Added: {stage.added} {stage.part.unit === "FEET" ? "ft" : "ea"}
            </p>
            <p className="font-medium text-shelley-gray">
              New on-hand total: {stage.newTotal} {stage.part.unit === "FEET" ? "ft" : "ea"}
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={reset} className="btn-primary">
              Receive another part
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery(stage.part.partNumber);
                runSearch(stage.part.partNumber);
              }}
              className="btn-secondary"
            >
              Receive more of this part
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
