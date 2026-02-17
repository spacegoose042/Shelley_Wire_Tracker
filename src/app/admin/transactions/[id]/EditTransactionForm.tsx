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
      {
        partId: first.id,
        partNumber: first.partNumber,
        location: first.location,
        unit: first.unit,
        quantity: "",
      },
    ]);
  }

  function setLinePart(index: number, part: PartOption) {
    setLines((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        partId: part.id,
        partNumber: part.partNumber,
        location: part.location,
        unit: part.unit,
      };
      return next;
    });
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedJob = jobName.trim();
    if (!trimmedJob) {
      setError("Job name is required.");
      return;
    }
    const payloadLines = lines
      .filter((l) => l.partId && l.quantity && Number(l.quantity) > 0)
      .map((l) => ({ partId: l.partId, quantity: Number(l.quantity) }));
    if (payloadLines.length === 0) {
      setError("Add at least one part with a quantity.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/transactions/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobName: trimmedJob, lines: payloadLines }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to update.");
      return;
    }
    router.push("/admin/transactions");
    router.refresh();
  }

  return (
    <div className="card max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
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
            {lines.map((line, index) => (
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
                        {p.location ? ` (${p.location})` : ""} – on hand: {p.currentQuantity}{" "}
                        {p.unit === "FEET" ? "ft" : "ea"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
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
                    className="input-field"
                    placeholder={line.unit === "FEET" ? "ft" : "ea"}
                  />
                </div>
                <span className="text-sm text-shelley-gray">
                  {line.unit === "FEET" ? "ft" : "ea"}
                </span>
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="text-shelley-red hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-shelley-red">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </button>
          <Link href="/admin/transactions" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
