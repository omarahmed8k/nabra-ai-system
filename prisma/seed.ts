/* eslint-disable prefer-top-level-await */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.requestComment.deleteMany();
  await prisma.request.deleteMany();
  await prisma.clientSubscription.deleteMany();
  await prisma.package.deleteMany();
  await prisma.serviceType.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing data");

  // Create single free package
  const freePackage = await prisma.package.create({
    data: {
      name: "Free",
      description: "Starter access with limited credits",
      credits: 1,
      price: 0,
      durationDays: 30,
      maxFreeRevisions: 1,
      isFreePackage: true,
      features: [
        "Free access",
        "Limited request credits",
        "Basic support",
      ],
      sortOrder: 1,
    },
  });

  console.log("📦 Created package:", freePackage.name);

  // Create only the admin user
  const hashedAdminPassword = await bcrypt.hash("admin123456", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@nabra.com",
      password: hashedAdminPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log("👤 Created admin:", admin.email);

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Test Accounts:");
  console.log("─".repeat(50));
  console.log("Super Admin:  admin@nabra.com      / admin123456");
  console.log("─".repeat(50));
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
