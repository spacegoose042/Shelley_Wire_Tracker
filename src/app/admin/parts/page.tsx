import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { AdminPartsContent } from "./AdminPartsContent";

export default async function AdminPartsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-shelley-blue">Parts</h1>
        <p className="mt-1 text-shelley-gray">Manage part numbers and inventory.</p>
      </div>
      <AdminNav />
      <AdminPartsContent />
    </div>
  );
}
