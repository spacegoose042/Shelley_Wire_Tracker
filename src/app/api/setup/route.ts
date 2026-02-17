import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

const ADMIN_EMAIL = "deb@shelleyelectric.com";
const ADMIN_PASSWORD = "DebIsHot*42";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { ok: false, error: "DATABASE_URL is not set. Check Railway variables." },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const expected = process.env.SETUP_SECRET;

    const userCount = await prisma.user.count();
    const allowWithoutSecret = userCount === 0;

    if (userCount > 0 && (!expected || secret !== expected)) {
      return NextResponse.json(
        { ok: false, error: "Admin already exists. Use SETUP_SECRET to run setup again." },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      return NextResponse.json(
        { ok: true, message: "Admin user already exists. Sign in with " + ADMIN_EMAIL + " and your password." },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const passwordHash = await hash(ADMIN_PASSWORD, 12);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        name: "Deb",
        role: "ADMIN",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Admin user created. Sign in with " + ADMIN_EMAIL + " and password: " + ADMIN_PASSWORD,
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Setup error:", e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: "Setup failed: " + message },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
