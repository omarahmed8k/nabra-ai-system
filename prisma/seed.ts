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
  await prisma.paymentProof.deleteMany();
  await prisma.clientSubscription.deleteMany();
  await prisma.packageService.deleteMany();
  await prisma.package.deleteMany();
  await prisma.serviceType.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing data");

  // Create only the admin user
  const hashedAdminPassword = await bcrypt.hash("Nabra@2020#Alaa", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@nabra.com",
      password: hashedAdminPassword,
      role: "SUPER_ADMIN",
    },
  });

  console.log("👤 Created admin:", admin.email);

  // Create Free Package (required for new client registrations)
  const freePackage = await prisma.package.create({
    data: {
      name: "Free Plan",
      description: "Basic free plan for all new users with 10 credits valid for 30 days",
      price: 0,
      credits: 1,
      durationDays: 30,
      maxFreeRevisions: 1,
      isActive: true,
      isFreePackage: true,
      sortOrder: 0,
    },
  });

  console.log("📦 Created free package:", freePackage.name);

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Admin Account:");
  console.log("─".repeat(50));
  console.log("Super Admin:  admin@nabra.com      / Nabra@2020#Alaa");
  console.log("─".repeat(50));
  console.log("\n📦 Free Package Created:");
  console.log("─".repeat(50));
  console.log("Name:         Free Plan");
  console.log("Credits:      10");
  console.log("Duration:     30 days");
  console.log("Price:        $0");
  console.log("─".repeat(50));
  console.log("\n💡 New clients will automatically receive the free plan upon registration.");
  console.log("💡 You can create additional packages and services through the admin panel.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
