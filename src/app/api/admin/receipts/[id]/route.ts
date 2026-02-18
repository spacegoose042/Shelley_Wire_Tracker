import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  quantity: z.number().positive().optional(),
  notes: z.string().optional(),
});

async function getReceipt(id: string) {
  return prisma.inventoryReceipt.findUnique({
    where: { id },
    include: { part: { select: { id: true, partNumber: true, location: true, unit: true, currentQuantity: true } } },
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
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const receipt = await getReceipt(id);
  if (!receipt) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

  const oldQty = Number(receipt.quantity);
  const newQty = parsed.data.quantity ?? oldQty;
  const delta = newQty - oldQty; // positive = more stock, negative = less stock

  // If reducing recorded quantity, check inventory won't go negative
  if (delta < 0) {
    const current = Number(receipt.part.currentQuantity);
    if (current + delta < 0) {
      const ul = receipt.part.unit === "FEET" ? "ft" : "ea";
      return NextResponse.json(
        {
          error: `Cannot reduce receipt quantity by ${-delta} ${ul} — that would make ${receipt.part.partNumber}${receipt.part.location ? ` (${receipt.part.location})` : ""} go below zero. Current on hand: ${current} ${ul}.`,
        },
        { status: 400 }
      );
    }
  }

  const updateData: { quantity?: number; notes?: string | null } = {};
  if (parsed.data.quantity !== undefined) updateData.quantity = newQty;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes.trim() || null;

  const [updated] = await prisma.$transaction([
    prisma.inventoryReceipt.update({ where: { id }, data: updateData }),
    ...(delta !== 0
      ? [prisma.part.update({ where: { id: receipt.partId }, data: { currentQuantity: { increment: delta } } })]
      : []),
  ]);

  return NextResponse.json({
    id: updated.id,
    quantity: Number(updated.quantity),
    notes: updated.notes,
    createdAt: updated.createdAt,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const receipt = await getReceipt(id);
  if (!receipt) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

  const qty = Number(receipt.quantity);
  const current = Number(receipt.part.currentQuantity);

  if (current - qty < 0) {
    const ul = receipt.part.unit === "FEET" ? "ft" : "ea";
    return NextResponse.json(
      {
        error: `Cannot delete receipt — reversing ${qty} ${ul} would make ${receipt.part.partNumber}${receipt.part.location ? ` (${receipt.part.location})` : ""} go below zero. Current on hand: ${current} ${ul}.`,
      },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.inventoryReceipt.delete({ where: { id } }),
    prisma.part.update({ where: { id: receipt.partId }, data: { currentQuantity: { decrement: qty } } }),
  ]);

  return NextResponse.json({ success: true });
}
