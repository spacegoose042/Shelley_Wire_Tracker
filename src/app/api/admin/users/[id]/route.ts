import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hash } from "bcryptjs";

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "TECHNICIAN"]).optional(),
  password: z.string().min(6).optional(),
});

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
    return NextResponse.json({ error: parsed.error.flatten().formErrors[0] ?? parsed.error.message }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { name, email, role, password } = parsed.data;

  if (email && email.toLowerCase() !== existing.email) {
    const taken = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (taken) return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const updateData: {
    name?: string | null;
    email?: string;
    role?: "ADMIN" | "TECHNICIAN";
    passwordHash?: string;
  } = {};

  if (name !== undefined) updateData.name = name.trim() || null;
  if (email !== undefined) updateData.email = email.trim().toLowerCase();
  if (role !== undefined) updateData.role = role;
  if (password) updateData.passwordHash = await hash(password, 12);

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  if (session.user.id === id)
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });

  await prisma.user.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
