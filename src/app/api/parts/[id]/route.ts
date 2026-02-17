import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  partNumber: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  unit: z.enum(["FEET", "EACH"]).optional(),
  currentQuantity: z.number().min(0).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const part = await prisma.part.findUnique({
    where: { id },
  });
  if (!part) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...part,
    currentQuantity: Number(part.currentQuantity),
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

  const part = await prisma.part.findUnique({ where: { id } });
  if (!part) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = parsed.data;
  if (data.partNumber && data.partNumber !== part.partNumber) {
    const existing = await prisma.part.findUnique({
      where: { partNumber: data.partNumber },
    });
    if (existing) return NextResponse.json({ error: "Part number already in use" }, { status: 400 });
  }

  const updateData: { partNumber?: string; description?: string | null; unit?: "FEET" | "EACH"; currentQuantity?: number } = {};
  if (data.partNumber) updateData.partNumber = data.partNumber;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.unit) updateData.unit = data.unit;
  if (typeof data.currentQuantity === "number") updateData.currentQuantity = data.currentQuantity;

  const updated = await prisma.part.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    ...updated,
    currentQuantity: Number(updated.currentQuantity),
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
  await prisma.part.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
