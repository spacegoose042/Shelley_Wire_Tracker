import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hash } from "bcryptjs";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(["ADMIN", "TECHNICIAN"]).default("TECHNICIAN"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(users);
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

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing)
    return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });

  const passwordHash = await hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      name: parsed.data.name ?? null,
      role: parsed.data.role,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(user);
}
