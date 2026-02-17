import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
        lines: { include: { part: { select: { partNumber: true, description: true, unit: true } } } },
      },
    }),
    prisma.transaction.count(),
  ]);

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t.id,
      jobName: t.jobName,
      createdAt: t.createdAt,
      user: t.user,
      lines: t.lines.map((l) => ({
        partNumber: l.part.partNumber,
        description: l.part.description,
        unit: l.part.unit,
        quantity: Number(l.quantity),
      })),
    })),
    total,
  });
}
