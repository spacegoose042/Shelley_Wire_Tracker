import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parts = await prisma.part.findMany({
    select: { location: true },
    distinct: ["location"],
    orderBy: { location: "asc" },
  });

  const locations = parts
    .map((p) => p.location)
    .filter((l) => l && l.trim() !== "");

  return NextResponse.json(locations);
}
