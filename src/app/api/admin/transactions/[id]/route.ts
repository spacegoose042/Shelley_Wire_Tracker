import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  jobName: z.string().min(1).optional(),
  lines: z
    .array(z.object({ partId: z.string().min(1), quantity: z.number().positive() }))
    .min(1)
    .optional(),
  processed: z.boolean().optional(),
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

  const { jobName, lines: newLines, processed } = parsed.data;
  const hasAny = jobName !== undefined || newLines !== undefined || processed !== undefined;
  if (!hasAny)
    return NextResponse.json({ error: "Provide jobName, lines, or processed" }, { status: 400 });

  const existing = await prisma.transaction.findUnique({
    where: { id },
    include: { lines: { include: { part: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (newLines !== undefined) {
    const partIds = Array.from(new Set(newLines.map((l) => l.partId)));
    const parts = await prisma.part.findMany({ where: { id: { in: partIds } } });
    if (parts.length !== partIds.length)
      return NextResponse.json({ error: "One or more parts not found" }, { status: 400 });

    for (const line of newLines) {
      const part = parts.find((p) => p.id === line.partId)!;
      const currentQty = Number(part.currentQuantity);
      const oldLine = existing.lines.find((l) => l.partId === line.partId);
      const oldQty = oldLine ? Number(oldLine.quantity) : 0;
      const afterRestore = currentQty + oldQty;
      if (afterRestore < line.quantity)
        return NextResponse.json(
          {
            error: `Insufficient quantity for ${part.partNumber}${part.location ? ` (${part.location})` : ""}. Available after reverting: ${afterRestore}`,
          },
          { status: 400 }
        );
    }
  }

  if (newLines !== undefined) {
    await prisma.$transaction(async (tx) => {
      for (const line of existing.lines) {
        await tx.part.update({
          where: { id: line.partId },
          data: { currentQuantity: { increment: Number(line.quantity) } },
        });
      }
      await tx.transactionLine.deleteMany({ where: { transactionId: id } });
      await tx.transactionLine.createMany({
        data: newLines.map((l) => ({
          transactionId: id,
          partId: l.partId,
          quantity: l.quantity,
        })),
      });
      for (const line of newLines) {
        await tx.part.update({
          where: { id: line.partId },
          data: { currentQuantity: { decrement: line.quantity } },
        });
      }
      const updateData: { jobName?: string; processed?: boolean } = {};
      if (jobName !== undefined) updateData.jobName = jobName;
      if (processed !== undefined) updateData.processed = processed;
      if (Object.keys(updateData).length > 0) {
        await tx.transaction.update({ where: { id }, data: updateData });
      }
    });
  } else {
    const updateData: { jobName?: string; processed?: boolean } = {};
    if (jobName !== undefined) updateData.jobName = jobName;
    if (processed !== undefined) updateData.processed = processed;
    if (Object.keys(updateData).length > 0) {
      await prisma.transaction.update({ where: { id }, data: updateData });
    }
  }

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
