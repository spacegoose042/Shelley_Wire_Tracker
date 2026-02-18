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
  | { type: "receiving"; part: Part; qty: string; notes: string; saving: boolean; error: string }
  | { type: "done"; part: Part; added: number; newTotal: number }
  // Brand-new part number — all fields editable
  | { type: "create-new" }
  // Same part number at a new location — description locked from existing record
  | { type: "create-location"; partNumber: string; description: string; unit: "FEET" | "EACH" };

export function ReceiveInventory({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [stage, setStage] = useState<Stage>({ type: "idle" });

  // Shared create-form fields
  const [formPartNumber, setFormPartNumber] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formUnit, setFormUnit] = useState<"FEET" | "EACH">("FEET");
  const [formQty, setFormQty] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (initialQuery.trim()) runSearch(initialQuery.trim());
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
    setStage({ type: "receiving", part, qty: "", notes: "", saving: false, error: "" });
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
      body: JSON.stringify({ addQuantity: qty, notes: stage.notes || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStage({ ...stage, saving: false, error: data.error ?? "Failed to save." });
      return;
    }
    setStage({ type: "done", part: stage.part, added: qty, newTotal: data.currentQuantity });
  }

  // Open "new location" form — description and part number locked from existing record
  function openAddLocation(existing: Part) {
    setFormPartNumber(existing.partNumber);
    setFormDesc(existing.description ?? "");
    setFormLocation("");
    setFormUnit(existing.unit as "FEET" | "EACH");
    setFormQty("");
    setFormError("");
    setStage({
      type: "create-location",
      partNumber: existing.partNumber,
      description: existing.description ?? "",
      unit: existing.unit as "FEET" | "EACH",
    });
  }

  // Open "new part" form — all fields blank
  function openCreateNew() {
    setFormPartNumber("");
    setFormDesc("");
    setFormLocation("");
    setFormUnit("FEET");
    setFormQty("");
    setFormError("");
    setStage({ type: "create-new" });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (stage.type !== "create-new" && stage.type !== "create-location") return;

    const pn = (stage.type === "create-location" ? stage.partNumber : formPartNumber).trim();
    const desc = (stage.type === "create-location" ? stage.description : formDesc).trim();
    const loc = formLocation.trim();
    const unit = stage.type === "create-location" ? stage.unit : formUnit;

    if (!pn) { setFormError("Part number is required."); return; }
    if (!desc) { setFormError("Description is required."); return; }
    if (!loc) { setFormError("Location is required."); return; }

    const qty = parseFloat(formQty) || 0;
    if (qty < 0) { setFormError("Quantity must be 0 or greater."); return; }

    setFormSaving(true);
    setFormError("");
    const res = await fetch("/api/admin/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partNumber: pn, description: desc, location: loc, unit, currentQuantity: qty }),
    });
    const data = await res.json().catch(() => ({}));
    setFormSaving(false);
    if (!res.ok) {
      setFormError(data.error ?? "Failed to create part.");
      return;
    }
    setStage({ type: "done", part: data, added: qty, newTotal: data.currentQuantity });
  }

  function reset() {
    setQuery("");
    setStage({ type: "idle" });
  }

  const isCreateStage = stage.type === "create-new" || stage.type === "create-location";
  const isLockedCreate = stage.type === "create-location";

  return (
    <div className="max-w-2xl space-y-6">

      {/* Search + OR divider + New part — shown on idle and results */}
      {(stage.type === "idle" || stage.type === "results") && (
        <div className="card space-y-5">
          <div>
            <h2 className="mb-1 font-medium text-shelley-blue">Receive stock for an existing part</h2>
            <p className="mb-3 text-sm text-shelley-gray">
              Search by part number. If it&apos;s in the system, select the location to receive into.
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

          <div>
            <h2 className="mb-1 font-medium text-shelley-blue">Enter a brand-new part number</h2>
            <p className="mb-3 text-sm text-shelley-gray">
              Part number not in the system at all? Add it here.
            </p>
            <button type="button" onClick={openCreateNew} className="btn-secondary">
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
              <h2 className="font-medium text-shelley-blue">Select location to receive into</h2>
              <p className="text-sm text-shelley-gray">
                {stage.parts.length} location{stage.parts.length !== 1 ? "s" : ""} on file for &ldquo;{stage.query}&rdquo;
              </p>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                {stage.parts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 px-4 py-3 bg-white">
                    <div>
                      <p className="font-medium text-shelley-blue">
                        {p.partNumber}
                        {p.location
                          ? <span className="ml-2 text-sm font-normal text-shelley-gray">@ {p.location}</span>
                          : <span className="ml-2 text-xs font-normal text-shelley-gray italic">no location set</span>
                        }
                      </p>
                      {p.description && <p className="text-sm text-shelley-gray">{p.description}</p>}
                      <p className="text-xs text-shelley-gray">
                        On hand: {p.currentQuantity} {p.unit === "FEET" ? "ft" : "ea"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startReceive(p)}
                      className="btn-primary text-sm whitespace-nowrap"
                    >
                      Receive here
                    </button>
                  </div>
                ))}
              </div>
              {/* New stocking location for same part — description locked */}
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-3">
                <p className="text-sm font-medium text-shelley-gray">
                  Receiving into a different location?
                </p>
                <p className="mt-0.5 text-xs text-shelley-gray">
                  This adds a new location record for &ldquo;{stage.query}&rdquo; — the description stays the same.
                </p>
                <button
                  type="button"
                  className="mt-2 btn-secondary text-sm"
                  onClick={() => openAddLocation(stage.parts[0])}
                >
                  Add new location for &ldquo;{stage.query}&rdquo;
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <h2 className="font-medium text-shelley-blue">Part not found</h2>
              <p className="text-sm text-shelley-gray">
                &ldquo;{stage.query}&rdquo; is not in the system. You can create it as a new part below, or search again.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormPartNumber(stage.query);
                  setFormDesc("");
                  setFormLocation("");
                  setFormUnit("FEET");
                  setFormQty("");
                  setFormError("");
                  setStage({ type: "create-new" });
                }}
                className="btn-primary"
              >
                Create &ldquo;{stage.query}&rdquo; as a new part
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enter quantity for existing part */}
      {stage.type === "receiving" && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-shelley-blue">Enter quantity received</h2>
            <button type="button" onClick={reset} className="text-sm text-shelley-gray hover:underline">Start over</button>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-0.5">
            <p className="font-medium text-shelley-blue">
              {stage.part.partNumber}
              {stage.part.location
                ? <span className="ml-2 text-sm font-normal text-shelley-gray">@ {stage.part.location}</span>
                : null}
            </p>
            {stage.part.description && <p className="text-sm text-shelley-gray">{stage.part.description}</p>}
            <p className="text-xs text-shelley-gray">
              Current on hand: {stage.part.currentQuantity} {stage.part.unit === "FEET" ? "ft" : "ea"}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
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
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium text-shelley-gray">
                Notes <span className="font-normal">(optional — PO #, vendor, etc.)</span>
              </label>
              <input
                type="text"
                value={stage.notes}
                onChange={(e) => setStage({ ...stage, notes: e.target.value })}
                className="input-field"
                placeholder="e.g. PO-1234 from ABC Supply"
              />
            </div>
          </div>
          <div>
            <button type="button" onClick={submitReceive} disabled={stage.saving} className="btn-primary">
              {stage.saving ? "Saving…" : "Add to inventory"}
            </button>
          </div>
          {stage.error && <p className="text-sm text-shelley-red">{stage.error}</p>}
        </div>
      )}

      {/* Create form — two modes */}
      {isCreateStage && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-shelley-blue">
              {isLockedCreate ? "Add new stocking location" : "Create new part"}
            </h2>
            <button type="button" onClick={reset} className="text-sm text-shelley-gray hover:underline">Start over</button>
          </div>

          {isLockedCreate && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-0.5">
              <p className="text-xs font-medium uppercase text-shelley-gray">Part (locked)</p>
              <p className="font-medium text-shelley-blue">
                {stage.type === "create-location" ? stage.partNumber : ""}
              </p>
              <p className="text-sm text-shelley-gray">
                {stage.type === "create-location" ? stage.description : ""}
              </p>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Part number — editable only for create-new */}
            {!isLockedCreate && (
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[160px]">
                  <label className="mb-1 block text-sm font-medium text-shelley-gray">
                    Part number <span className="text-shelley-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formPartNumber}
                    onChange={(e) => setFormPartNumber(e.target.value)}
                    className="input-field"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1 block text-sm font-medium text-shelley-gray">
                    Description <span className="text-shelley-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 12 AWG THHN Wire"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1 block text-sm font-medium text-shelley-gray">
                  Location <span className="text-shelley-red">*</span>
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Bay 1234"
                  required
                  autoFocus={isLockedCreate}
                />
              </div>
              <div className="w-32">
                <label className="mb-1 block text-sm font-medium text-shelley-gray">Unit</label>
                <select
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value as "FEET" | "EACH")}
                  className="input-field"
                  disabled={isLockedCreate}
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
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  className="input-field"
                  placeholder="0"
                />
              </div>
            </div>

            {formError && <p className="text-sm text-shelley-red">{formError}</p>}
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={formSaving}>
                {formSaving ? "Saving…" : isLockedCreate ? "Add location" : "Save part"}
              </button>
              <button type="button" onClick={reset} className="btn-secondary">Cancel</button>
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
            {stage.part.description && <p className="text-shelley-gray">{stage.part.description}</p>}
            <p className="text-shelley-gray">Added: {stage.added} {stage.part.unit === "FEET" ? "ft" : "ea"}</p>
            <p className="font-medium text-shelley-gray">
              New on-hand total: {stage.newTotal} {stage.part.unit === "FEET" ? "ft" : "ea"}
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={reset} className="btn-primary">Receive another part</button>
            <button
              type="button"
              onClick={() => { setQuery(stage.part.partNumber); runSearch(stage.part.partNumber); }}
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
