import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { EditTransactionForm } from "./EditTransactionForm";

export default async function AdminEditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const t = await prisma.transaction.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
      lines: {
        include: {
          part: {
            select: {
              id: true,
              partNumber: true,
              description: true,
              location: true,
              unit: true,
              currentQuantity: true,
            },
          },
        },
      },
    },
  });
  if (!t) notFound();

  const initial = {
    id: t.id,
    jobName: t.jobName,
    createdAt: t.createdAt.toISOString(),
    user: t.user,
    lines: t.lines.map((l) => ({
      id: l.id,
      partId: l.partId,
      partNumber: l.part.partNumber,
      description: l.part.description,
      location: l.part.location,
      unit: l.part.unit as string,
      quantity: Number(l.quantity),
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/transactions"
          className="text-sm font-medium text-shelley-gray hover:text-shelley-blue"
        >
          ← Back to transactions
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-shelley-blue">Edit pull</h1>
        <p className="mt-1 text-shelley-gray">
          {new Date(t.createdAt).toLocaleString()} · {t.user.name ?? t.user.email}
        </p>
      </div>
      <EditTransactionForm initial={initial} />
    </div>
  );
}
