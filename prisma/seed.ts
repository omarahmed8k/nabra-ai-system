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

  // Create service types with custom Q&A attributes
  await prisma.serviceType.create({
    data: {
      name: "Graphic Design",
      description: "Professional graphic design services",
      icon: "🎨",
      creditCost: 2,
      sortOrder: 1,
      attributes: [
        {
          question: "Do you need it as an offer post?",
          required: true,
          type: "select",
          options: ["Yes", "No"],
        },
        {
          question: "What are the dimensions you need?",
          required: true,
          type: "text",
        },
        {
          question: "Do you have a preferred color scheme?",
          required: false,
          type: "text",
        },
        {
          question: "What file formats do you need?",
          required: true,
          type: "multiselect",
          options: ["PNG", "JPG", "SVG", "PDF", "AI"],
        },
      ],
    },
  });

  await prisma.serviceType.create({
    data: {
      name: "Video Editing",
      description: "Professional video editing and post-production",
      icon: "🎬",
      creditCost: 3,
      sortOrder: 2,
      attributes: [
        {
          question: "What is the video duration?",
          required: true,
          type: "text",
        },
        {
          question: "Do you need background music?",
          required: true,
          type: "select",
          options: ["Yes", "No"],
        },
        {
          question: "What is the video purpose?",
          required: true,
          type: "select",
          options: ["Social Media", "Website", "Advertisement", "Other"],
        },
        {
          question: "Any specific effects or transitions?",
          required: false,
          type: "text",
        },
      ],
    },
  });

  await prisma.serviceType.create({
    data: {
      name: "Content Writing",
      description: "Professional content writing services",
      icon: "✍️",
      creditCost: 5,
      sortOrder: 3,
      attributes: [
        {
          question: "What type of content do you need?",
          required: true,
          type: "select",
          options: ["Blog Post", "Article", "Social Media", "Website Copy", "Other"],
        },
        {
          question: "How many words approximately?",
          required: true,
          type: "text",
        },
        {
          question: "Do you have any specific keywords to include?",
          required: false,
          type: "text",
        },
        {
          question: "What is the target audience?",
          required: true,
          type: "text",
        },
      ],
    },
  });

  console.log("🛠️ Created service types with Q&A attributes");

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
