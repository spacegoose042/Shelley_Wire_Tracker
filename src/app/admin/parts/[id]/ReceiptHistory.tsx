"use client";

import { useEffect, useState, useCallback } from "react";

type Receipt = {
  id: string;
  quantity: number;
  notes: string | null;
  jobWorkOrders: { id: string; number: string; createdAt: string }[];
  createdAt: string;
  receivedBy: string | null;
};

type EditState = {
  quantity: string;
  notes: string;
  jobWorkOrderNumber: string;
  saving: boolean;
  error: string;
  confirmDelete: boolean;
};

function JobWorkOrderHistory({ jobs }: { jobs: Receipt["jobWorkOrders"] }) {
  if (jobs.length === 0) return <>—</>;
  return (
    <div className="space-y-1">
      {jobs.map((job) => (
        <div key={job.id}>
          <span className="font-medium text-shelley-blue">{job.number}</span>
          <span className="ml-1 text-xs text-shelley-gray">
            added {new Date(job.createdAt).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ReceiptHistory({ partId, unit }: { partId: string; unit: string }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    quantity: "",
    notes: "",
    jobWorkOrderNumber: "",
    saving: false,
    error: "",
    confirmDelete: false,
  });

  const ul = unit === "FEET" ? "ft" : "ea";

  const fetchReceipts = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/parts/${partId}/receipts`)
      .then((r) => r.json())
      .then((data) => setReceipts(Array.isArray(data) ? data : []))
      .catch(() => setReceipts([]))
      .finally(() => setLoading(false));
  }, [partId]);

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

  async function saveEdit(receiptId: string) {
    const qty = Number(editState.quantity);
    if (!editState.quantity || isNaN(qty) || qty <= 0) {
      setEditState((s) => ({ ...s, error: "Quantity must be a positive number." }));
      return;
    }
    setEditState((s) => ({ ...s, saving: true, error: "" }));
    const res = await fetch(`/api/admin/receipts/${receiptId}`, {
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

  async function deleteReceipt(receiptId: string) {
    if (!editState.confirmDelete) {
      setEditState((s) => ({ ...s, confirmDelete: true }));
      return;
    }
    setEditState((s) => ({ ...s, saving: true, error: "" }));
    const res = await fetch(`/api/admin/receipts/${receiptId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEditState((s) => ({ ...s, saving: false, error: data.error ?? "Failed to delete.", confirmDelete: false }));
      return;
    }
    setEditingId(null);
    fetchReceipts();
  }

  if (loading) return <p className="text-sm text-shelley-gray">Loading receipt history…</p>;

  return (
    <div className="card space-y-3">
      <h2 className="font-medium text-shelley-blue">Receipt history</h2>
      {receipts.length === 0 ? (
        <p className="text-sm text-shelley-gray">No receipts recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-shelley-gray">Date</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-shelley-gray">Qty received</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-shelley-gray">Job/WO history</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-shelley-gray">Received by</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-shelley-gray">Notes</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-shelley-gray">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {receipts.map((r) => {
                const isEditing = editingId === r.id;

                if (isEditing) {
                  return (
                    <>
                      {/* Context row */}
                      <tr key={`${r.id}-ctx`} className="bg-blue-50/60">
                        <td className="whitespace-nowrap px-3 py-2 text-shelley-gray">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <span className="line-through opacity-50 text-green-700">+{r.quantity} {ul}</span>
                        </td>
                        <td className="px-3 py-2 text-shelley-gray">
                          <JobWorkOrderHistory jobs={r.jobWorkOrders} />
                        </td>
                        <td className="px-3 py-2 text-shelley-gray">{r.receivedBy ?? "—"}</td>
                        <td className="px-3 py-2 text-shelley-gray">
                          <span className="line-through opacity-50">{r.notes ?? "—"}</span>
                        </td>
                        <td />
                      </tr>

                      {/* Edit row */}
                      <tr key={`${r.id}-edit`} className="bg-blue-50">
                        <td colSpan={6} className="px-3 py-3">
                          <div className="flex flex-wrap items-start gap-3">
                            <div className="w-28">
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
                            <div className="flex-1 min-w-[180px]">
                              <label className="mb-1 block text-xs font-medium text-shelley-gray">Notes</label>
                              <input
                                type="text"
                                value={editState.notes}
                                onChange={(e) => setEditState((s) => ({ ...s, notes: e.target.value }))}
                                placeholder="PO #, vendor, etc."
                                className="input-field"
                              />
                            </div>
                            <div className="flex-1 min-w-[180px]">
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
                                onClick={() => saveEdit(r.id)}
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
                                    onClick={() => deleteReceipt(r.id)}
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
                                  onClick={() => deleteReceipt(r.id)}
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
                    <td className="whitespace-nowrap px-3 py-2 text-shelley-gray">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-green-700">
                      +{r.quantity} {ul}
                    </td>
                    <td className="px-3 py-2 text-shelley-gray">
                      <JobWorkOrderHistory jobs={r.jobWorkOrders} />
                    </td>
                    <td className="px-3 py-2 text-shelley-gray">{r.receivedBy ?? "—"}</td>
                    <td className="px-3 py-2 text-shelley-gray">{r.notes ?? "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <button
                        onClick={() => startEdit(r)}
                        className="text-sm text-shelley-blue hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
