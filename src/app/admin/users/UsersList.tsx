"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

export function UsersList() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

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
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-shelley-gray">
                Role
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-shelley-blue">
                  {u.email}
                </td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
