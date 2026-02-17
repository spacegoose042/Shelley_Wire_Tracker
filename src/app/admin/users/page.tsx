import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { UsersList } from "./UsersList";
import { AddUserForm } from "./AddUserForm";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-shelley-blue">Users</h1>
        <p className="mt-1 text-shelley-gray">Manage technicians and admins.</p>
      </div>
      <AdminNav />
      <AddUserForm />
      <UsersList />
    </div>
  );
}
