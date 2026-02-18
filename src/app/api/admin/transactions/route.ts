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
  const processedParam = searchParams.get("processed");
  const userId = searchParams.get("userId") ?? "";
  const job = (searchParams.get("job") ?? "").trim();
  const partNumber = (searchParams.get("partNumber") ?? "").trim();

  const where: {
    processed?: boolean;
    userId?: string;
    jobName?: { contains: string; mode: "insensitive" };
    lines?: { some: { part: { partNumber: { contains: string; mode: "insensitive" } } } };
  } = {};
  if (processedParam === "true") where.processed = true;
  else if (processedParam === "false") where.processed = false;
  if (userId) where.userId = userId;
  if (job) where.jobName = { contains: job, mode: "insensitive" };
  if (partNumber) where.lines = { some: { part: { partNumber: { contains: partNumber, mode: "insensitive" } } } };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
        lines: { include: { part: { select: { partNumber: true, description: true, location: true, unit: true } } } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t.id,
      jobName: t.jobName,
      processed: t.processed,
      createdAt: t.createdAt,
      user: t.user,
      lines: t.lines.map((l) => ({
        partNumber: l.part.partNumber,
        description: l.part.description,
        location: l.part.location,
        unit: l.part.unit,
        quantity: Number(l.quantity),
      })),
    })),
    total,
  });
}
