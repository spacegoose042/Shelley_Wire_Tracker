"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  id: string;
  partNumber: string;
  description: string;
  unit: string;
  currentQuantity: number;
};

export function EditPartForm({ id, partNumber, description, unit, currentQuantity }: Props) {
  const router = useRouter();
  const [partNumberVal, setPartNumberVal] = useState(partNumber);
  const [descriptionVal, setDescriptionVal] = useState(description);
  const [unitVal, setUnitVal] = useState<"FEET" | "EACH">(unit as "FEET" | "EACH");
  const [qtyVal, setQtyVal] = useState(String(currentQuantity));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
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
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-shelley-gray">Description</label>
          <input
            type="text"
            value={descriptionVal}
            onChange={(e) => setDescriptionVal(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-shelley-gray">Unit</label>
          <select
            value={unitVal}
            onChange={(e) => setUnitVal(e.target.value as "FEET" | "EACH")}
            className="input-field w-28"
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
          />
        </div>
        {error && <p className="text-sm text-shelley-red">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </button>
          <Link href="/admin/parts" className="btn-secondary">
            Back to parts
          </Link>
        </div>
      </form>
    </div>
  );
}
