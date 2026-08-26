import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@photobookhub.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin123!";

async function main() {
  const hashedPassword = await hash(ADMIN_PASSWORD, 12);

  const admin = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", hashedPassword },
    create: {
      email: ADMIN_EMAIL,
      name: "Admin",
      hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`Admin user ready: ${admin.email} (${admin.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
