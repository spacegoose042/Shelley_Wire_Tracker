import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  jobName: z.string().min(1).optional(),
  processed: z.boolean().optional(),
  // Final line state to store on the transaction record
  lines: z
    .array(z.object({ partId: z.string().min(1), quantity: z.number().positive() }))
    .min(1)
    .optional(),
  // Explicit inventory movements: positive delta = add to stock, negative = remove from stock
  inventoryAdjustments: z
    .array(z.object({ partId: z.string().min(1), delta: z.number() }))
    .optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: t.id,
    jobName: t.jobName,
    processed: t.processed,
    createdAt: t.createdAt,
    user: t.user,
    lines: t.lines.map((l) => ({
      id: l.id,
      partId: l.partId,
      partNumber: l.part.partNumber,
      description: l.part.description,
      location: l.part.location,
      unit: l.part.unit,
      quantity: Number(l.quantity),
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { jobName, lines: newLines, processed, inventoryAdjustments } = parsed.data;
  const hasAny =
    jobName !== undefined ||
    newLines !== undefined ||
    processed !== undefined ||
    inventoryAdjustments !== undefined;
  if (!hasAny)
    return NextResponse.json(
      { error: "Provide jobName, lines, processed, or inventoryAdjustments" },
      { status: 400 }
    );

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Validate any negative inventory adjustments (pulling from stock)
  if (inventoryAdjustments && inventoryAdjustments.length > 0) {
    // Aggregate deltas by partId in case the same part appears more than once
    const deltaMap = new Map<string, number>();
    for (const adj of inventoryAdjustments) {
      deltaMap.set(adj.partId, (deltaMap.get(adj.partId) ?? 0) + adj.delta);
    }

    const partIds = Array.from(deltaMap.keys());
    const parts = await prisma.part.findMany({ where: { id: { in: partIds } } });

    for (const [partId, delta] of Array.from(deltaMap)) {
      if (delta >= 0) continue; // returning to stock — always fine
      const part = parts.find((p) => p.id === partId);
      if (!part)
        return NextResponse.json(
          { error: `Part ${partId} not found` },
          { status: 400 }
        );
      const available = Number(part.currentQuantity);
      if (available + delta < 0)
        return NextResponse.json(
          {
            error: `Insufficient stock for ${part.partNumber}${part.location ? ` (${part.location})` : ""}. Available: ${available} ${part.unit === "FEET" ? "ft" : "ea"}, trying to pull: ${-delta}.`,
          },
          { status: 400 }
        );
    }
  }

  // Validate new line parts exist
  if (newLines) {
    const partIds = Array.from(new Set(newLines.map((l) => l.partId)));
    const parts = await prisma.part.findMany({ where: { id: { in: partIds } } });
    if (parts.length !== partIds.length)
      return NextResponse.json({ error: "One or more parts not found" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    // Apply explicit inventory adjustments
    if (inventoryAdjustments) {
      for (const adj of inventoryAdjustments) {
        await tx.part.update({
          where: { id: adj.partId },
          data: { currentQuantity: { increment: adj.delta } },
        });
      }
    }

    // Replace transaction lines
    if (newLines) {
      await tx.transactionLine.deleteMany({ where: { transactionId: id } });
      await tx.transactionLine.createMany({
        data: newLines.map((l) => ({
          transactionId: id,
          partId: l.partId,
          quantity: l.quantity,
        })),
      });
    }

    // Update metadata
    const updateData: { jobName?: string; processed?: boolean } = {};
    if (jobName !== undefined) updateData.jobName = jobName;
    if (processed !== undefined) updateData.processed = processed;
    if (Object.keys(updateData).length > 0) {
      await tx.transaction.update({ where: { id }, data: updateData });
    }
  });

  const updated = await prisma.transaction.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
      lines: { include: { part: { select: { partNumber: true, location: true, unit: true } } } },
    },
  });

  return NextResponse.json({
    id: updated!.id,
    jobName: updated!.jobName,
    processed: updated!.processed,
    createdAt: updated!.createdAt,
    user: updated!.user,
    lines: updated!.lines.map((l) => ({
      partNumber: l.part.partNumber,
      location: l.part.location,
      unit: l.part.unit,
      quantity: Number(l.quantity),
    })),
  });
}
