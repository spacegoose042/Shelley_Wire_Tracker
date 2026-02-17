"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddPartForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [partNumber, setPartNumber] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState<"FEET" | "EACH">("FEET");
  const [currentQuantity, setCurrentQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const qty = parseFloat(currentQuantity);
    if (isNaN(qty) || qty < 0) {
      setError("Quantity must be 0 or greater.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partNumber: partNumber.trim(),
        description: description.trim() || undefined,
        unit,
        currentQuantity: qty,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to add part.");
      return;
    }
    setPartNumber("");
    setDescription("");
    setCurrentQuantity("");
    onSuccess?.();
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="mb-4 font-medium text-shelley-blue">Add part</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-sm text-shelley-gray">Part number</label>
          <input
            type="text"
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value)}
            className="input-field w-48"
            required
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-sm text-shelley-gray">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-shelley-gray">Unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as "FEET" | "EACH")}
            className="input-field w-28"
          >
            <option value="FEET">Feet</option>
            <option value="EACH">Each</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-shelley-gray">Initial quantity</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={currentQuantity}
            onChange={(e) => setCurrentQuantity(e.target.value)}
            className="input-field w-28"
            placeholder="0"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Adding…" : "Add part"}
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-shelley-red">{error}</p>}
    </div>
  );
}
