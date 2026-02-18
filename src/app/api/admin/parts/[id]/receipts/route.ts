import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const receipts = await prisma.inventoryReceipt.findMany({
    where: { partId: id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(
    receipts.map((r) => ({
      id: r.id,
      quantity: Number(r.quantity),
      notes: r.notes,
      createdAt: r.createdAt,
      receivedBy: r.user ? (r.user.name ?? r.user.email) : null,
    }))
  );
}
