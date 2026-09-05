import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const partNumber = searchParams.get("partNumber")?.trim() || "";
  const jobWorkOrderNumber = searchParams.get("jobWorkOrderNumber")?.trim() || "";
  const userId = searchParams.get("userId")?.trim() || "";
  const from = searchParams.get("from")?.trim() || "";
  const to = searchParams.get("to")?.trim() || "";

  const receipts = await prisma.inventoryReceipt.findMany({
    where: {
      ...(partNumber
        ? { part: { partNumber: { contains: partNumber, mode: "insensitive" } } }
        : {}),
      ...(jobWorkOrderNumber
        ? {
            jobWorkOrders: {
              some: { number: { contains: jobWorkOrderNumber, mode: "insensitive" } },
            },
          }
        : {}),
      ...(userId ? { userId } : {}),
      ...((from || to)
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      part: { select: { partNumber: true, description: true, location: true, unit: true } },
      user: { select: { name: true, email: true } },
      jobWorkOrders: {
        orderBy: { createdAt: "asc" },
        select: { id: true, number: true, createdAt: true },
      },
    },
  });

  return NextResponse.json(
    receipts.map((r) => ({
      id: r.id,
      partNumber: r.part.partNumber,
      description: r.part.description,
      location: r.part.location,
      unit: r.part.unit,
      quantity: Number(r.quantity),
      notes: r.notes,
      jobWorkOrders: r.jobWorkOrders,
      createdAt: r.createdAt,
      receivedBy: r.user ? (r.user.name ?? r.user.email) : null,
      receivedById: r.userId,
    }))
  );
}
