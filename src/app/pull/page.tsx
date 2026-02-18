"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/BarcodeScanner";

type PartOption = {
  id: string;
  partNumber: string;
  description: string | null;
  location: string | null;
  unit: string;
  currentQuantity: number;
};

type Line = {
  partId: string;
  partNumber: string;
  description: string | null;
  location: string;
  unit: string;
  quantity: string;
  currentQuantity: number;
};

export default function PullPage() {
  const router = useRouter();
  const [jobName, setJobName] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { partId: "", partNumber: "", description: null, location: "", unit: "FEET", quantity: "", currentQuantity: 0 },
  ]);
  const [partSearch, setPartSearch] = useState<PartOption[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [scanningForLine, setScanningForLine] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const searchParts = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPartSearch([]);
      return;
    }
    const res = await fetch(`/api/parts?q=${encodeURIComponent(q)}`);
    if (!res.ok) return;
    const data = await res.json();
    setPartSearch(data);
  }, []);

  const handlePartSelect = (index: number, part: PartOption) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        partId: part.id,
        partNumber: part.partNumber,
        description: part.description,
        location: part.location ?? "",
        unit: part.unit,
        currentQuantity: part.currentQuantity,
        quantity: next[index].quantity || "",
      };
      return next;
    });
    setSearchValue("");
    setPartSearch([]);
  };

  const handleScan = (index: number, value: string) => {
    setScanningForLine(null);
    const trimmed = value.trim();
    if (!trimmed) return;
    searchParts(trimmed);
    setSearchValue(trimmed);
    setActiveLineIndex(index);
    setLines((prev) => {
      const next = [...prev];
      if (!next[index].partId) {
        next[index] = { ...next[index], partNumber: trimmed, quantity: next[index].quantity };
      }
      return next;
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { partId: "", partNumber: "", description: null, location: "", unit: "FEET", quantity: "", currentQuantity: 0 },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = {
      jobName: jobName.trim(),
      lines: lines
        .filter((l) => l.partId && l.quantity && Number(l.quantity) > 0)
        .map((l) => ({ partId: l.partId, quantity: Number(l.quantity) })),
    };
    if (payload.lines.length === 0) {
      setError("Add at least one part with a quantity.");
      return;
    }
    if (!payload.jobName) {
      setError("Enter the job name or number.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-shelley-gray hover:text-shelley-blue"
        >
          ← Back to dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-shelley-blue">Record pull</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <label htmlFor="jobName" className="mb-1 block text-sm font-medium text-shelley-gray">
            Job name or number
          </label>
          <input
            id="jobName"
            type="text"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            className="input-field"
            placeholder="e.g. Smith Residence – 1234"
            required
          />
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-shelley-blue">Parts</h2>
            <button type="button" onClick={addLine} className="btn-secondary text-sm">
              Add line
            </button>
          </div>

          {lines.map((line, index) => (
            <div
              key={index}
              className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4"
            >
              <div className="relative flex-1 min-w-[180px]">
                <label className="mb-1 block text-xs font-medium text-shelley-gray">
                  Part number
                  {line.location ? (
                    <span className="ml-1 font-normal text-shelley-gray">
                      (from {line.location})
                    </span>
                  ) : null}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={line.partNumber}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLines((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], partNumber: v };
                        return next;
                      });
                      setSearchValue(v);
                      setActiveLineIndex(index);
                      searchParts(v);
                    }}
                    onFocus={() => {
                      setActiveLineIndex(index);
                      setSearchValue(line.partNumber);
                      if (line.partNumber) searchParts(line.partNumber);
                    }}
                    placeholder="Type or scan"
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setScanningForLine(index)}
                    className="btn-secondary whitespace-nowrap"
                  >
                    Scan
                  </button>
                </div>
                {activeLineIndex === index && partSearch.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {partSearch.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => handlePartSelect(index, p)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-shelley-blue/10"
                        >
                          {p.partNumber}
                          {p.description ? ` – ${p.description}` : ""}
                          {p.location ? ` [${p.location}]` : ""} (on hand: {p.currentQuantity}{" "}
                          {p.unit === "FEET" ? "ft" : "ea"})
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="w-28">
                <label className="mb-1 block text-xs font-medium text-shelley-gray">Qty</label>
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
              <div className="text-sm text-shelley-gray">
                {line.unit === "FEET" ? "ft" : "ea"}
              </div>
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="text-shelley-red hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-shelley-red" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : "Record pull"}
        </button>
      </form>

      {scanningForLine !== null && (
        <BarcodeScanner
          onScan={(value) => handleScan(scanningForLine, value)}
          onClose={() => setScanningForLine(null)}
        />
      )}
    </div>
  );
}
