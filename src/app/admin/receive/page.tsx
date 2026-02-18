import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { ReceiveInventory } from "./ReceiveInventory";

export default async function AdminReceivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const { q } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-shelley-blue">Receive inventory</h1>
        <p className="mt-1 text-shelley-gray">
          Look up a part to add stock, or create a new part if it isn&apos;t in the system yet.
        </p>
      </div>
      <AdminNav />
      <ReceiveInventory initialQuery={q ?? ""} />
    </div>
  );
}
