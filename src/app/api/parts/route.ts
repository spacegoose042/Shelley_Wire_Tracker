import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const location = searchParams.get("location")?.trim() ?? "";

  const where: Record<string, unknown> = { archived: false };
  if (location) where.location = location;
  if (q) {
    where.OR = [
      { partNumber: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const parts = await prisma.part.findMany({
    where,
    orderBy: { partNumber: "asc" },
    take: 20,
    select: { id: true, partNumber: true, description: true, location: true, unit: true, currentQuantity: true },
  });

  return NextResponse.json(
    parts.map((p) => ({
      ...p,
      currentQuantity: Number(p.currentQuantity),
    }))
  );
}
