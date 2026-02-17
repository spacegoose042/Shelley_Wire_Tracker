import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/AdminNav";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const [partCount, transactionCount, lowStockCount] = await Promise.all([
    prisma.part.count(),
    prisma.transaction.count(),
    prisma.part.count({ where: { currentQuantity: { lt: 100 } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-shelley-blue">
          Welcome, {session?.user?.name ?? session?.user?.email}
        </h1>
        <p className="mt-1 text-shelley-gray">Record pulls and manage inventory.</p>
      </div>

      {isAdmin && <AdminNav />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/pull"
          className="card flex flex-col border-shelley-blue/20 bg-shelley-blue/5 transition hover:border-shelley-blue/40 hover:bg-shelley-blue/10"
        >
          <span className="text-sm font-medium text-shelley-blue">Record pull</span>
          <p className="mt-1 text-sm text-shelley-gray">
            Log wire or parts pulled for a job
          </p>
        </Link>
        <div className="card">
          <span className="text-sm font-medium text-shelley-gray">Parts in system</span>
          <p className="mt-1 text-2xl font-semibold text-shelley-blue">{partCount}</p>
        </div>
        <div className="card">
          <span className="text-sm font-medium text-shelley-gray">Total transactions</span>
          <p className="mt-1 text-2xl font-semibold text-shelley-blue">{transactionCount}</p>
        </div>
      </div>

      {isAdmin && lowStockCount > 0 && (
        <div className="card border-shelley-red/30 bg-shelley-red/5">
          <p className="text-sm font-medium text-shelley-red">
            {lowStockCount} part(s) below 100 units –{" "}
            <Link href="/admin/parts" className="underline">
              Review parts
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
