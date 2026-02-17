"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "TECHNICIAN">("TECHNICIAN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
        role,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to add user.");
      return;
    }
    setEmail("");
    setPassword("");
    setName("");
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="mb-4 font-medium text-shelley-blue">Add user</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
        <div className="min-w-[200px]">
          <label className="mb-1 block text-sm text-shelley-gray">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="tech@shelleyelectric.com"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-shelley-gray">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-48"
            minLength={6}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-shelley-gray">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field w-48"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-shelley-gray">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "TECHNICIAN")}
            className="input-field w-32"
          >
            <option value="TECHNICIAN">Technician</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Adding…" : "Add user"}
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-shelley-red">{error}</p>}
    </div>
  );
}
