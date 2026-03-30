import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPartSchema = z.object({
  partNumber: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  unit: z.enum(["FEET", "EACH"]).default("FEET"),
  currentQuantity: z.number().min(0).default(0),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const includeArchived = searchParams.get("includeArchived") === "true";

  const where: Record<string, unknown> = {};
  if (!includeArchived) where.archived = false;
  if (q) where.partNumber = { contains: q, mode: "insensitive" };

  const parts = await prisma.part.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: [{ partNumber: "asc" }, { location: "asc" }],
  });

  return NextResponse.json(
    parts.map((p) => ({ ...p, currentQuantity: Number(p.currentQuantity) }))
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createPartSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const location = (parsed.data.location?.trim() ?? "") || "";
  const existing = await prisma.part.findUnique({
    where: { partNumber_location: { partNumber: parsed.data.partNumber, location } },
  });
  if (existing)
    return NextResponse.json({ error: "This part number already exists at this location" }, { status: 400 });

  const part = await prisma.part.create({
    data: {
      partNumber: parsed.data.partNumber,
      description: parsed.data.description ?? null,
      location,
      unit: parsed.data.unit,
      currentQuantity: parsed.data.currentQuantity,
    },
  });

  return NextResponse.json({
    ...part,
    currentQuantity: Number(part.currentQuantity),
  });
}
