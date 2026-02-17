import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  jobName: z.string().min(1, "Job name is required"),
  lines: z.array(
    z.object({
      partId: z.string().min(1),
      quantity: z.number().positive("Quantity must be positive"),
    })
  ).min(1, "Add at least one part"),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors?.lines?.[0] ?? parsed.error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { jobName, lines } = parsed.data;

  const parts = await prisma.part.findMany({
    where: { id: { in: lines.map((l) => l.partId) } },
  });
  if (parts.length !== lines.length) {
    return NextResponse.json({ error: "One or more parts not found" }, { status: 400 });
  }

  for (const line of lines) {
    const part = parts.find((p) => p.id === line.partId)!;
    if (Number(part.currentQuantity) < line.quantity) {
      return NextResponse.json(
        { error: `Insufficient quantity for ${part.partNumber}. Available: ${part.currentQuantity}` },
        { status: 400 }
      );
    }
  }

  const transaction = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.create({
      data: {
        userId: session.user!.id,
        jobName,
        lines: {
          create: lines.map((l) => ({
            partId: l.partId,
            quantity: l.quantity,
          })),
        },
      },
      include: { lines: { include: { part: true } } },
    });

    for (const line of lines) {
      await tx.part.update({
        where: { id: line.partId },
        data: { currentQuantity: { decrement: line.quantity } },
      });
    }

    return t;
  });

  return NextResponse.json({
    id: transaction.id,
    jobName: transaction.jobName,
    createdAt: transaction.createdAt,
    lines: transaction.lines.map((l) => ({
      partNumber: l.part.partNumber,
      quantity: Number(l.quantity),
    })),
  });
}
