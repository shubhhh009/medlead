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

const TOTAL_LEADS = 10_000;

const treatments = [
  "CARDIAC",
  "ORTHOPEDIC",
  "ONCOLOGY",
  "IVF",
  "TRANSPLANT",
  "OTHER",
] as const;

const statuses = [
  "NEW",
  "CONTACTED",
  "REPORTS_RECEIVED",
  "QUOTATION_SENT",
  "TRAVEL_PLANNED",
  "CONVERTED",
  "LOST",
] as const;

const countries = [
  "Bangladesh",
  "Nepal",
  "Sri Lanka",
  "Nigeria",
  "Kenya",
  "Uganda",
  "United Arab Emirates",
  "Maldives",
] as const;

const cities = [
  "Delhi",
  "Mumbai",
  "Chennai",
  "Bengaluru",
  "Hyderabad",
  "Kolkata",
] as const;

async function main() {
  const adminPassword = await bcrypt.hash("AdminDemo@123!", 12);
  const callerPassword = await bcrypt.hash("CallerDemo@123!", 12);

  const admin = await prisma.user.upsert({
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

 const callers: Array<{ id: string }> = [];

  for (let i = 1; i <= 3; i++) {
    const caller = await prisma.user.upsert({
      where: { email: `caller${i}@medlead.demo` },
      update: {
        name: `MedLead Tele-caller ${i}`,
        passwordHash: callerPassword,
        role: "TELECALLER",
      },
      create: {
        name: `MedLead Tele-caller ${i}`,
        email: `caller${i}@medlead.demo`,
        passwordHash: callerPassword,
        role: "TELECALLER",
      },
    });

    callers.push(caller);
  }

  const batchSize = 500;
  let createdOrExisting = 0;

  for (let start = 1; start <= TOTAL_LEADS; start += batchSize) {
    const end = Math.min(start + batchSize - 1, TOTAL_LEADS);

    const leads = Array.from({ length: end - start + 1 }, (_, offset) => {
      const i = start + offset;
      const caller = callers[(i - 1) % callers.length];

      return {
        fullName: `Demo Patient ${String(i).padStart(5, "0")}`,
        country: countries[(i - 1) % countries.length],
        phone: `+8801${String(i).padStart(9, "0")}`,
        email: `demo.patient.${i}@medlead.demo`,
        treatment: treatments[(i - 1) % treatments.length],
        description: `Dummy inquiry ${i} for demonstration and testing.`,
        preferredCity: cities[(i - 1) % cities.length],
        status: statuses[(i - 1) % statuses.length],
        assignedToId: caller.id,
      };
    });

    await prisma.lead.createMany({
      data: leads,
      skipDuplicates: true,
    });

    createdOrExisting += leads.length;
    console.log(`Processed lead records: ${createdOrExisting}/${TOTAL_LEADS}`);
  }

  const [adminCount, callerCount, seededLeadCount] = await Promise.all([
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({
      where: {
        role: "TELECALLER",
        email: { in: [
          "caller1@medlead.demo",
          "caller2@medlead.demo",
          "caller3@medlead.demo",
        ] },
      },
    }),
    prisma.lead.count({
      where: { email: { startsWith: "demo.patient." } },
    }),
  ]);

  console.log("\nSeed completed.");
  console.log(`Admin accounts in database: ${adminCount}`);
  console.log(`Assignment demo tele-callers: ${callerCount}`);
  console.log(`Seeded dummy leads present: ${seededLeadCount}`);

  if (admin.role !== "ADMIN" || callerCount !== 3 || seededLeadCount < TOTAL_LEADS) {
    throw new Error(
      "Seed verification did not reach the required counts. Check existing database records and seed output.",
    );
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
