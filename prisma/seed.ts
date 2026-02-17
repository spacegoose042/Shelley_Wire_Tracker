import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "deb@shelleyelectric.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin user already exists:", email);
    return;
  }

  const passwordHash = await hash(process.env.ADMIN_INITIAL_PASSWORD ?? "shelley-admin-1", 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Deb",
      role: "ADMIN",
    },
  });
  console.log("Created admin user:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
