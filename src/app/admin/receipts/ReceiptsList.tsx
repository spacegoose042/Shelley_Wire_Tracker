"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ReceiptLabelButton } from "@/components/ReceiptLabelButton";

type Receipt = {
  id: string;
  partNumber: string;
  description: string | null;
  location: string;
  unit: string;
  quantity: number;
  notes: string | null;
  jobWorkOrders: { id: string; number: string; createdAt: string }[];
  createdAt: string;
  receivedBy: string | null;
  receivedById: string | null;
};

type User = { id: string; name: string | null; email: string };

type EditState = {
  quantity: string;
  notes: string;
  jobWorkOrderNumber: string;
  saving: boolean;
  error: string;
  confirmDelete: boolean;
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function JobWorkOrderHistory({ jobs }: { jobs: Receipt["jobWorkOrders"] }) {
  if (jobs.length === 0) return <>—</>;
  return (
    <div className="space-y-1">
      {jobs.map((job) => (
        <div key={job.id}>
          <span className="font-medium text-shelley-blue">{job.number}</span>
          <span className="ml-1 text-xs text-shelley-gray">added {fmt(job.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

export function ReceiptsList() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [partNumber, setPartNumber] = useState("");
  const [jobWorkOrderNumber, setJobWorkOrderNumber] = useState("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // id of the receipt currently being edited (null = none)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    quantity: "",
    notes: "",
    jobWorkOrderNumber: "",
    saving: false,
    error: "",
    confirmDelete: false,
  });

  const fetchReceipts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (partNumber) params.set("partNumber", partNumber);
    if (jobWorkOrderNumber) params.set("jobWorkOrderNumber", jobWorkOrderNumber);
    if (userId) params.set("userId", userId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/admin/receipts?${params}`)
      .then((r) => r.json())
      .then((d) => setReceipts(Array.isArray(d) ? d : []))
      .catch(() => setReceipts([]))
      .finally(() => setLoading(false));
  }, [partNumber, jobWorkOrderNumber, userId, from, to]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  function startEdit(r: Receipt) {
    setEditingId(r.id);
    setEditState({
      quantity: String(r.quantity),
      notes: r.notes ?? "",
      jobWorkOrderNumber: "",
      saving: false,
      error: "",
      confirmDelete: false,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(r: Receipt) {
    const qty = Number(editState.quantity);
    if (!editState.quantity || isNaN(qty) || qty <= 0) {
      setEditState((s) => ({ ...s, error: "Quantity must be a positive number." }));
      return;
    }
    setEditState((s) => ({ ...s, saving: true, error: "" }));
    const res = await fetch(`/api/admin/receipts/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: qty,
        notes: editState.notes,
        jobWorkOrderNumber: editState.jobWorkOrderNumber.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEditState((s) => ({ ...s, saving: false, error: data.error ?? "Failed to save." }));
      return;
    }
    setEditingId(null);
    fetchReceipts();
  }

  async function deleteReceipt(r: Receipt) {
    if (!editState.confirmDelete) {
      setEditState((s) => ({ ...s, confirmDelete: true }));
      return;
    }
    setEditState((s) => ({ ...s, saving: true, error: "" }));
    const res = await fetch(`/api/admin/receipts/${r.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEditState((s) => ({ ...s, saving: false, error: data.error ?? "Failed to delete.", confirmDelete: false }));
      return;
    }
    setEditingId(null);
    fetchReceipts();
  }

  const totalQtyByUnit = receipts.reduce<Record<string, number>>((acc, r) => {
    const label = r.unit === "FEET" ? "ft" : "ea";
    acc[label] = (acc[label] ?? 0) + r.quantity;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card flex flex-wrap gap-3 p-4">
        <div className="flex-1 min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-shelley-gray uppercase">Part number</label>
          <input
            type="text"
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value)}
            placeholder="e.g. 100-00001"
            className="input-field text-sm"
          />
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-shelley-gray uppercase">Job/WO number</label>
          <input
            type="text"
            value={jobWorkOrderNumber}
            onChange={(e) => setJobWorkOrderNumber(e.target.value)}
            placeholder="e.g. WO-5678"
            className="input-field text-sm"
          />
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-shelley-gray uppercase">Received by</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-field text-sm"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-shelley-gray uppercase">From date</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input-field text-sm"
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-shelley-gray uppercase">To date</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input-field text-sm"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setPartNumber("");
              setJobWorkOrderNumber("");
              setUserId("");
              setFrom("");
              setTo("");
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-shelley-gray hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && receipts.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm text-shelley-gray">
          <span>
            <strong className="text-shelley-blue">{receipts.length}</strong> receipt{receipts.length !== 1 ? "s" : ""}
          </span>
          {Object.entries(totalQtyByUnit).map(([unit, qty]) => (
            <span key={unit}>
              Total received: <strong className="text-shelley-blue">{qty} {unit}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-shelley-gray">Loading receipts…</p>
      ) : receipts.length === 0 ? (
        <div className="card text-center text-shelley-gray">No receipts found.</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Part number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Location</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-shelley-gray">Qty received</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Job/WO history</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Received by</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Notes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-shelley-gray">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {receipts.map((r) => {
                  const ul = r.unit === "FEET" ? "ft" : "ea";
                  const isEditing = editingId === r.id;

                  if (isEditing) {
                    return (
                      <>
                        {/* Read-only context row */}
                        <tr key={`${r.id}-ctx`} className="bg-blue-50/60">
                          <td className="whitespace-nowrap px-4 py-2 text-sm text-shelley-gray">{fmt(r.createdAt)}</td>
                          <td className="whitespace-nowrap px-4 py-2 font-medium text-shelley-blue">{r.partNumber}</td>
                          <td className="px-4 py-2 text-sm text-shelley-gray">{r.description || "—"}</td>
                          <td className="px-4 py-2 text-sm text-shelley-gray">{r.location || "—"}</td>
                          <td className="px-4 py-2 text-right text-sm text-shelley-gray">
                            <span className="line-through opacity-50">+{r.quantity} {ul}</span>
                          </td>
                          <td className="px-4 py-2 text-sm text-shelley-gray">
                            <JobWorkOrderHistory jobs={r.jobWorkOrders} />
                          </td>
                          <td className="px-4 py-2 text-sm text-shelley-gray">{r.receivedBy ?? "—"}</td>
                          <td className="px-4 py-2 text-sm text-shelley-gray">
                            <span className="line-through opacity-50">{r.notes || "—"}</span>
                          </td>
                          <td />
                        </tr>

                        {/* Edit row */}
                        <tr key={`${r.id}-edit`} className="bg-blue-50">
                          <td colSpan={9} className="px-4 py-3">
                            <div className="flex flex-wrap items-start gap-3">
                              <div className="w-32">
                                <label className="mb-1 block text-xs font-medium text-shelley-gray">
                                  Qty ({ul}) <span className="text-shelley-red">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={editState.quantity}
                                  onChange={(e) => setEditState((s) => ({ ...s, quantity: e.target.value }))}
                                  className="input-field"
                                  autoFocus
                                />
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <label className="mb-1 block text-xs font-medium text-shelley-gray">Notes</label>
                                <input
                                  type="text"
                                  value={editState.notes}
                                  onChange={(e) => setEditState((s) => ({ ...s, notes: e.target.value }))}
                                  placeholder="PO #, vendor, etc."
                                  className="input-field"
                                />
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <label className="mb-1 block text-xs font-medium text-shelley-gray">
                                  Add Job/WO <span className="font-normal">(keeps prior history)</span>
                                </label>
                                <input
                                  type="text"
                                  value={editState.jobWorkOrderNumber}
                                  onChange={(e) => setEditState((s) => ({ ...s, jobWorkOrderNumber: e.target.value }))}
                                  placeholder="New Job/WO number"
                                  className="input-field"
                                />
                              </div>
                              <div className="flex items-end gap-2 pt-5">
                                <button
                                  onClick={() => saveEdit(r)}
                                  disabled={editState.saving}
                                  className="btn-primary text-sm"
                                >
                                  {editState.saving ? "Saving…" : "Save"}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  disabled={editState.saving}
                                  className="btn-secondary text-sm"
                                >
                                  Cancel
                                </button>
                                {editState.confirmDelete ? (
                                  <>
                                    <span className="text-sm text-shelley-red font-medium">
                                      Delete and reverse inventory?
                                    </span>
                                    <button
                                      onClick={() => deleteReceipt(r)}
                                      disabled={editState.saving}
                                      className="rounded-lg bg-shelley-red px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                                    >
                                      Yes, delete
                                    </button>
                                    <button
                                      onClick={() => setEditState((s) => ({ ...s, confirmDelete: false }))}
                                      className="btn-secondary text-sm"
                                    >
                                      No
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => deleteReceipt(r)}
                                    disabled={editState.saving}
                                    className="text-sm text-shelley-red hover:underline"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                            {editState.error && (
                              <p className="mt-2 text-sm text-shelley-red">{editState.error}</p>
                            )}
                          </td>
                        </tr>
                      </>
                    );
                  }

                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-shelley-gray">{fmt(r.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/admin/receive?q=${encodeURIComponent(r.partNumber)}`}
                          className="font-medium text-shelley-blue hover:underline"
                        >
                          {r.partNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-shelley-gray">{r.description || "—"}</td>
                      <td className="px-4 py-3 text-sm text-shelley-gray">{r.location || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-shelley-blue">
                        +{r.quantity} {ul}
                      </td>
                      <td className="px-4 py-3 text-sm text-shelley-gray">
                        <JobWorkOrderHistory jobs={r.jobWorkOrders} />
                      </td>
                      <td className="px-4 py-3 text-sm text-shelley-gray">{r.receivedBy ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-shelley-gray">{r.notes || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <ReceiptLabelButton
                            partNumber={r.partNumber}
                            jobWorkOrderNumber={r.jobWorkOrders[r.jobWorkOrders.length - 1]?.number}
                            quantity={r.quantity}
                            unit={r.unit}
                          />
                          <button
                            onClick={() => startEdit(r)}
                            className="text-sm text-shelley-blue hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
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
