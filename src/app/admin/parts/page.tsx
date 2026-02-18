import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { PartsList } from "./PartsList";
import Link from "next/link";

export default async function AdminPartsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-shelley-blue">Parts</h1>
          <p className="mt-1 text-shelley-gray">
            Current part numbers and on-hand quantities.
          </p>
        </div>
        <Link href="/admin/receive" className="btn-primary whitespace-nowrap">
          Receive inventory
        </Link>
      </div>
      <AdminNav />
      <PartsList />
    </div>
  );
}
