"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  id: string;
  partNumber: string;
  description: string;
  location: string;
  unit: string;
  currentQuantity: number;
  archived: boolean;
  archivedAt: string | null;
};

export function EditPartForm({
  id,
  partNumber,
  description,
  location,
  unit,
  currentQuantity,
  archived,
  archivedAt,
}: Props) {
  const router = useRouter();
  const [partNumberVal, setPartNumberVal] = useState(partNumber);
  const [descriptionVal, setDescriptionVal] = useState(description);
  const [locationVal, setLocationVal] = useState(location);
  const [unitVal, setUnitVal] = useState<"FEET" | "EACH">(unit as "FEET" | "EACH");
  const [qtyVal, setQtyVal] = useState(String(currentQuantity));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Archive section state
  const [archiveStage, setArchiveStage] = useState<"idle" | "confirm">("idle");
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const qty = parseFloat(qtyVal);
    if (isNaN(qty) || qty < 0) {
      setError("Quantity must be 0 or greater.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/parts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partNumber: partNumberVal.trim(),
        description: descriptionVal.trim() || null,
        location: locationVal.trim() || null,
        unit: unitVal,
        currentQuantity: qty,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to update.");
      return;
    }
    router.refresh();
  }

  async function setArchived(value: boolean) {
    setArchiveLoading(true);
    setArchiveError("");
    const res = await fetch(`/api/parts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: value }),
    });
    const data = await res.json().catch(() => ({}));
    setArchiveLoading(false);
    if (!res.ok) {
      setArchiveError(data.error ?? "Failed to update.");
      return;
    }
    router.refresh();
  }

  const ul = unit === "FEET" ? "ft" : "ea";

  return (
    <div className="space-y-6">
      {/* Archived banner */}
      {archived && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex items-center gap-3">
          <span className="text-amber-700 text-lg">⚠</span>
          <div className="flex-1">
            <p className="font-medium text-amber-800">This part is archived</p>
            {archivedAt && (
              <p className="text-sm text-amber-700">
                Archived on {new Date(archivedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
            <p className="text-sm text-amber-700 mt-0.5">
              It is hidden from the parts list and cannot be pulled or restocked until unarchived.
            </p>
          </div>
          <button
            onClick={() => setArchived(false)}
            disabled={archiveLoading}
            className="shrink-0 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
          >
            {archiveLoading ? "Restoring…" : "Unarchive"}
          </button>
        </div>
      )}

      {/* Edit form */}
      <div className="card max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-shelley-gray">Part number</label>
            <input
              type="text"
              value={partNumberVal}
              onChange={(e) => setPartNumberVal(e.target.value)}
              className="input-field"
              required
              disabled={archived}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-shelley-gray">Description</label>
            <input
              type="text"
              value={descriptionVal}
              onChange={(e) => setDescriptionVal(e.target.value)}
              className="input-field"
              disabled={archived}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-shelley-gray">Location</label>
            <input
              type="text"
              value={locationVal}
              onChange={(e) => setLocationVal(e.target.value)}
              className="input-field"
              placeholder="e.g. Bin A-12"
              disabled={archived}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-shelley-gray">Unit</label>
            <select
              value={unitVal}
              onChange={(e) => setUnitVal(e.target.value as "FEET" | "EACH")}
              className="input-field w-28"
              disabled={archived}
            >
              <option value="FEET">Feet</option>
              <option value="EACH">Each</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-shelley-gray">Current quantity (on hand)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={qtyVal}
              onChange={(e) => setQtyVal(e.target.value)}
              className="input-field w-40"
              disabled={archived}
            />
          </div>
          {error && <p className="text-sm text-shelley-red">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={loading || archived}>
              {loading ? "Saving…" : "Save"}
            </button>
            <Link href="/admin/parts" className="btn-secondary">
              Back to parts
            </Link>
          </div>
          {archived && (
            <p className="text-xs text-shelley-gray">Unarchive this part to make edits.</p>
          )}
        </form>
      </div>

      {/* Archive / danger zone — only show for active parts */}
      {!archived && (
        <div className="max-w-xl rounded-lg border border-red-200 bg-red-50/40 p-5 space-y-3">
          <h3 className="font-semibold text-shelley-red">Archive this part</h3>
          <p className="text-sm text-shelley-gray">
            Archiving hides this location from the active parts list, the pull form, and the receive workflow.
            Historical transactions and receipts are preserved. You can unarchive at any time.
          </p>

          {currentQuantity > 0 && archiveStage === "idle" && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              ⚠ This location still has <strong>{currentQuantity} {ul}</strong> on hand.
              Archiving will not remove the inventory — make sure this is intentional.
            </div>
          )}

          {archiveError && <p className="text-sm text-shelley-red">{archiveError}</p>}

          {archiveStage === "idle" ? (
            <button
              type="button"
              onClick={() => setArchiveStage("confirm")}
              className="rounded-lg border border-shelley-red px-4 py-2 text-sm font-medium text-shelley-red hover:bg-shelley-red/5"
            >
              Archive this location…
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-shelley-red">
                Are you sure? This will hide{" "}
                <strong>{partNumber}{location ? ` (${location})` : ""}</strong> from active use.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setArchived(true)}
                  disabled={archiveLoading}
                  className="rounded-lg bg-shelley-red px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {archiveLoading ? "Archiving…" : "Yes, archive it"}
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveStage("idle")}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
