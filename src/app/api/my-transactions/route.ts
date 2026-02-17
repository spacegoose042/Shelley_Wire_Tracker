import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        lines: { include: { part: { select: { partNumber: true, description: true, unit: true } } } },
      },
    }),
    prisma.transaction.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t.id,
      jobName: t.jobName,
      createdAt: t.createdAt,
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
