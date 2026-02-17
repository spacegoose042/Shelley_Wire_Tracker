import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

const ADMIN_EMAIL = "deb@shelleyelectric.com";
const ADMIN_PASSWORD = "DebIsHot*42";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const expected = process.env.SETUP_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json(
      { error: "Invalid or missing setup secret. Set SETUP_SECRET in your environment and pass ?secret=..." },
      { status: 401 }
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      return NextResponse.json({
        ok: true,
        message: "Admin user already exists. You can sign in.",
      });
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

    return NextResponse.json({
      ok: true,
      message: "Admin user created. Sign in with deb@shelleyelectric.com and your chosen password.",
    });
  } catch (e) {
    console.error("Setup error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
