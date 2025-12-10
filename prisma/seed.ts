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

  // Create service types first
  const graphicDesignService = await prisma.serviceType.create({
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

  const videoEditingService = await prisma.serviceType.create({
    data: {
      name: "Video Editing",
      description: "Professional video editing and post-production",
      icon: "🎬",
      creditCost: 3,
      sortOrder: 2,
      attributes: [
        {
          question: "Video duration (in minutes)?",
          required: true,
          type: "text",
        },
        {
          question: "What style of editing do you prefer?",
          required: true,
          type: "select",
          options: ["Corporate", "Creative", "Documentary", "Social Media", "Cinematic"],
        },
        {
          question: "Do you need color grading?",
          required: true,
          type: "select",
          options: ["Yes", "No"],
        },
        {
          question: "What output format do you need?",
          required: true,
          type: "multiselect",
          options: ["MP4", "MOV", "AVI", "WebM"],
        },
      ],
    },
  });

  const contentWritingService = await prisma.serviceType.create({
    data: {
      name: "Content Writing",
      description: "High-quality content writing services",
      icon: "✍️",
      creditCost: 5,
      sortOrder: 3,
      attributes: [
        {
          question: "What type of content do you need?",
          required: true,
          type: "select",
          options: ["Blog Post", "Article", "Product Description", "Social Media", "Website Copy"],
        },
        {
          question: "Approximate word count?",
          required: true,
          type: "text",
        },
        {
          question: "Target audience?",
          required: true,
          type: "text",
        },
        {
          question: "SEO keywords to include?",
          required: false,
          type: "text",
        },
      ],
    },
  });

  console.log("🎨 Created service types");

  // Create packages with their allowed services
  const freePackage = await prisma.package.create({
    data: {
      name: "Free",
      description: "Starter access with limited credits and basic services",
      credits: 1,
      price: 0,
      durationDays: 30,
      maxFreeRevisions: 1,
      isFreePackage: true,
      features: [
        "1 request credit",
        "Graphic Design services only",
        "Basic support",
        "1 free revision",
      ],
      sortOrder: 1,
      services: {
        create: [
          { serviceId: graphicDesignService.id },
        ],
      },
    },
  });

  const proPackage = await prisma.package.create({
    data: {
      name: "Pro",
      description: "Professional package with more services and credits",
      credits: 10,
      price: 29.99,
      durationDays: 30,
      maxFreeRevisions: 3,
      isFreePackage: false,
      features: [
        "10 request credits",
        "Graphic Design & Video Editing",
        "Priority support",
        "3 free revisions per request",
      ],
      sortOrder: 2,
      services: {
        create: [
          { serviceId: graphicDesignService.id },
          { serviceId: videoEditingService.id },
        ],
      },
    },
  });

  const premiumPackage = await prisma.package.create({
    data: {
      name: "Premium",
      description: "Full access to all services with maximum credits",
      credits: 25,
      price: 79.99,
      durationDays: 30,
      maxFreeRevisions: 5,
      isFreePackage: false,
      features: [
        "25 request credits",
        "All services available",
        "Premium support",
        "5 free revisions per request",
        "Priority processing",
      ],
      sortOrder: 3,
      services: {
        create: [
          { serviceId: graphicDesignService.id },
          { serviceId: videoEditingService.id },
          { serviceId: contentWritingService.id },
        ],
      },
    },
  });

  console.log("📦 Created packages:", freePackage.name, proPackage.name, premiumPackage.name);

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
