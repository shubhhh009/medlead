
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from .env");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const adminPassword = await bcrypt.hash("AdminDemo@123!", 12);
  const callerPassword = await bcrypt.hash("CallerDemo@123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@medlead.demo" },
    update: {
      name: "MedLead Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
    create: {
      name: "MedLead Admin",
      email: "admin@medlead.demo",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "caller@medlead.demo" },
    update: {
      name: "MedLead Tele-caller",
      passwordHash: callerPassword,
      role: "TELECALLER",
    },
    create: {
      name: "MedLead Tele-caller",
      email: "caller@medlead.demo",
      passwordHash: callerPassword,
      role: "TELECALLER",
    },
  });

  console.log("Demo users created successfully!");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
