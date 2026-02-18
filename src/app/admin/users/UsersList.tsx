"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

type EditState = {
  name: string;
  email: string;
  role: "ADMIN" | "TECHNICIAN";
  password: string;
};

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: "", email: "", role: "TECHNICIAN", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  function openEdit(u: User) {
    setEditingId(u.id);
    setEditState({ name: u.name ?? "", email: u.email, role: u.role as "ADMIN" | "TECHNICIAN", password: "" });
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setError("");
  }

  async function saveEdit(userId: string) {
    setSaving(true);
    setError("");
    const body: Record<string, string> = {
      name: editState.name,
      email: editState.email,
      role: editState.role,
    };
    if (editState.password) body.password = editState.password;

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save.");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data } : u)));
    setEditingId(null);
  }

  if (loading) return <p className="text-shelley-gray">Loading users…</p>;
  if (users.length === 0)
    return (
      <div className="card text-center text-shelley-gray">
        No users yet. Add one above.
      </div>
    );

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">Role</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-shelley-gray">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((u) => (
              <>
                <tr key={u.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-shelley-blue">{u.email}</td>
                  <td className="px-4 py-3 text-shelley-gray">{u.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "ADMIN"
                          ? "bg-shelley-red/10 text-shelley-red"
                          : "bg-shelley-blue/10 text-shelley-blue"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => editingId === u.id ? cancelEdit() : openEdit(u)}
                      className="text-sm text-shelley-blue hover:underline"
                    >
                      {editingId === u.id ? "Cancel" : "Edit"}
                    </button>
                  </td>
                </tr>

                {editingId === u.id && (
                  <tr key={`${u.id}-edit`} className="bg-shelley-blue/5">
                    <td colSpan={4} className="px-4 py-4">
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-shelley-blue">Edit user</p>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex-1 min-w-[160px]">
                            <label className="mb-1 block text-xs font-medium text-shelley-gray">Name</label>
                            <input
                              type="text"
                              value={editState.name}
                              onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                              className="input-field"
                              placeholder="Display name"
                            />
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <label className="mb-1 block text-xs font-medium text-shelley-gray">Email</label>
                            <input
                              type="email"
                              value={editState.email}
                              onChange={(e) => setEditState((s) => ({ ...s, email: e.target.value }))}
                              className="input-field"
                              required
                            />
                          </div>
                          <div className="w-40">
                            <label className="mb-1 block text-xs font-medium text-shelley-gray">Role</label>
                            <select
                              value={editState.role}
                              onChange={(e) => setEditState((s) => ({ ...s, role: e.target.value as "ADMIN" | "TECHNICIAN" }))}
                              className="input-field"
                            >
                              <option value="TECHNICIAN">Technician</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                          <div className="flex-1 min-w-[180px]">
                            <label className="mb-1 block text-xs font-medium text-shelley-gray">
                              New password <span className="font-normal">(leave blank to keep current)</span>
                            </label>
                            <input
                              type="password"
                              value={editState.password}
                              onChange={(e) => setEditState((s) => ({ ...s, password: e.target.value }))}
                              className="input-field"
                              placeholder="••••••"
                            />
                          </div>
                        </div>
                        {error && <p className="text-sm text-shelley-red">{error}</p>}
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => saveEdit(u.id)}
                            disabled={saving}
                            className="btn-primary text-sm"
                          >
                            {saving ? "Saving…" : "Save changes"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
