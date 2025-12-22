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
  await prisma.requestWatcher.deleteMany();
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
      name: "Nabarawy",
      email: "nabraagency20@gmail.com",
      password: hashedAdminPassword,
      image: "/images/nabarawy.png",
      role: "SUPER_ADMIN",
    },
  });

  console.log("👤 Created admin:", admin.email);

  // Create Free Package (required for new client registrations)
  const freePackage = await prisma.package.create({
    data: {
      name: "Free Plan",
      nameI18n: { en: "Free Plan", ar: "الخطة المجانية" },
      description: "Basic free plan for all new users with 1 credit valid for 14 days",
      descriptionI18n: {
        en: "Basic free plan for all new users with 1 credit valid for 14 days",
        ar: "خطة مجانية أساسية لجميع المستخدمين الجدد مع رصيد واحد صالح لمدة 14 يومًا",
      },
      price: 0,
      credits: 1,
      durationDays: 14,
      isActive: true,
      isFreePackage: true,
      supportAllServices: true,
      sortOrder: 0,
    } as any,
  });

  console.log("📦 Created free package:", freePackage.name);

  // Create Service Types
  //
  // Credit Impact Logic for Attributes:
  // - For select/number inputs: Final cost = selectedValue × creditImpact
  //   Example: User selects "2" segments with creditImpact: 5 → 2 × 5 = 10 extra credits
  //
  // - For inputs with includedQuantity: Final cost = max(0, selectedValue - includedQuantity) × creditImpact
  //   Example: 25 products with includedQuantity: 20 and creditImpact: 1 → (25-20) × 1 = 5 extra credits
  //
  const socialMediaDesign = await prisma.serviceType.create({
    data: {
      name: "Social Media Design",
      nameI18n: { en: "Social Media Design", ar: "تصميم لمنصات التواصل الاجتماعي" },
      description: "Professional designs for social media platforms",
      descriptionI18n: {
        en: "Professional designs for social media platforms",
        ar: "تصميمات احترافية لمنصات التواصل الاجتماعي",
      },
      creditCost: 5,
      maxFreeRevisions: 1,
      paidRevisionCost: 2,
      isActive: true,
      sortOrder: 1,
    },
  });

  const reelVideo = await prisma.serviceType.create({
    data: {
      name: "Reel Video (5-10 sec)",
      nameI18n: { en: "Reel Video (5-10 sec)", ar: "ريل فيديو (5-10 ثانية)" },
      description:
        "Short video reels for social media (5-10 seconds base, +5 credits per additional 10 seconds)",
      descriptionI18n: {
        en: "Short video reels for social media (5-10 seconds base, +5 credits per additional 10 seconds)",
        ar: "ريلز قصيرة لمنصات التواصل الاجتماعي (5-10 ثوان أساسي، +5 كريدت لكل 10 ثوان إضافية)",
      },
      creditCost: 10,
      maxFreeRevisions: 1,
      paidRevisionCost: 2,
      isActive: true,
      sortOrder: 2,
      attributes: [
        {
          question: "How many additional 10-second segments?",
          questionI18n: {
            en: "How many additional 10-second segments?",
            ar: "كم عدد المقاطع الإضافية (10 ثوان لكل مقطع)؟",
          },
          required: false,
          type: "select",
          options: ["0", "1", "2", "3"],
          creditImpact: 5, // 5 credits per segment selected (e.g., selecting "2" = 2 × 5 = 10 credits)
        },
      ],
    },
  });

  const logoDesign = await prisma.serviceType.create({
    data: {
      name: "Logo Design",
      nameI18n: { en: "Logo Design", ar: "تصميم لوجو" },
      description: "Professional logo design for your brand",
      descriptionI18n: {
        en: "Professional logo design for your brand",
        ar: "تصميم شعار احترافي لعلامتك التجارية",
      },
      creditCost: 50,
      maxFreeRevisions: 1,
      paidRevisionCost: 2,
      isActive: true,
      sortOrder: 3,
    },
  });

  const voiceOver = await prisma.serviceType.create({
    data: {
      name: "Voice Over (Arabic)",
      nameI18n: { en: "Voice Over (Arabic)", ar: "أداء صوتي (عربي)" },
      description: "Professional Arabic voice over for videos",
      descriptionI18n: {
        en: "Professional Arabic voice over for videos",
        ar: "أداء صوتي احترافي باللغة العربية للفيديوهات",
      },
      creditCost: 5,
      maxFreeRevisions: 1,
      paidRevisionCost: 2,
      isActive: true,
      sortOrder: 4,
    },
  });

  const digitalMenu = await prisma.serviceType.create({
    data: {
      name: "Digital QR Menu",
      nameI18n: { en: "Digital QR Menu", ar: "منيو QR ديجيتال" },
      description:
        "Digital menu with QR code (50 credits for first 20 products, +1 credit per additional product)",
      descriptionI18n: {
        en: "Digital menu with QR code (50 credits for first 20 products, +1 credit per additional product)",
        ar: "منيو رقمي مع رمز QR (50 كريدت لأول 20 منتج، +1 كريدت لكل منتج إضافي)",
      },
      creditCost: 50,
      maxFreeRevisions: 1,
      paidRevisionCost: 2,
      isActive: true,
      sortOrder: 5,
      attributes: [
        {
          question: "Total number of products in menu",
          questionI18n: {
            en: "Total number of products in menu",
            ar: "إجمالي عدد المنتجات في المنيو",
          },
          required: true,
          type: "number",
          min: 1,
          includedQuantity: 20, // First 20 products included in base price
          creditImpact: 1, // 1 credit per product after the first 20 (e.g., 25 products = (25-20) × 1 = 5 credits)
        },
      ],
    },
  });

  const animation2D = await prisma.serviceType.create({
    data: {
      name: "2D Animation Video",
      nameI18n: { en: "2D Animation Video", ar: "فيديو انيميشن 2D" },
      description:
        "2D animation video (20 credits for first 10 seconds, +10 credits per additional 10 seconds)",
      descriptionI18n: {
        en: "2D animation video (20 credits for first 10 seconds, +10 credits per additional 10 seconds)",
        ar: "فيديو انيميشن 2D (20 كريدت لأول 10 ثوان، +10 كريدت لكل 10 ثوان إضافية)",
      },
      creditCost: 20,
      maxFreeRevisions: 1,
      paidRevisionCost: 2,
      isActive: true,
      sortOrder: 6,
      attributes: [
        {
          question: "How many additional 10-second segments?",
          questionI18n: {
            en: "How many additional 10-second segments?",
            ar: "كم عدد المقاطع الإضافية (10 ثوان لكل مقطع)؟",
          },
          required: false,
          type: "select",
          options: ["0", "1", "2", "3", "4", "5"],
          creditImpact: 10, // 10 credits per segment selected (e.g., selecting "3" = 3 × 10 = 30 credits)
        },
      ],
    },
  });

  const animation3D = await prisma.serviceType.create({
    data: {
      name: "3D Animation Video",
      nameI18n: { en: "3D Animation Video", ar: "فيديو انيميشن 3D" },
      description:
        "3D animation video (40 credits for first 10 seconds, +15 credits per additional 10 seconds)",
      descriptionI18n: {
        en: "3D animation video (40 credits for first 10 seconds, +15 credits per additional 10 seconds)",
        ar: "فيديو انيميشن 3D (40 كريدت لأول 10 ثوان، +15 كريدت لكل 10 ثوان إضافية)",
      },
      creditCost: 40,
      maxFreeRevisions: 1,
      paidRevisionCost: 2,
      isActive: true,
      sortOrder: 7,
      attributes: [
        {
          question: "How many additional 10-second segments?",
          questionI18n: {
            en: "How many additional 10-second segments?",
            ar: "كم عدد المقاطع الإضافية (10 ثوان لكل مقطع)؟",
          },
          required: false,
          type: "select",
          options: ["0", "1", "2", "3", "4", "5"],
          creditImpact: 15, // 15 credits per segment selected (e.g., selecting "2" = 2 × 15 = 30 credits)
        },
      ],
    },
  });

  console.log("🎨 Created service types");

  // Create Package 1 - 30 Credits (Basic)
  const package1 = await prisma.package.create({
    data: {
      name: "Basic Package - 30 Credits",
      nameI18n: { en: "Basic Package - 30 Credits", ar: "الباقة الأولى - 30 كريدت" },
      description:
        "Includes social media designs and reels. Suitable for small businesses and retail stores.",
      descriptionI18n: {
        en: "Includes social media designs and reels. Suitable for small businesses and retail stores.",
        ar: "تشمل تصميمات لمنصات التواصل الاجتماعي وريلز. مناسبة للشركات الصغيرة والمحلات التجارية.",
      },
      featuresI18n: {
        en: [
          "Social media designs (5 credits each)",
          "Reels 5-10 seconds (10 credits, +5 per extra 10 sec)",
          "First revision free, 2 credits after",
          "Voice over available (+5 credits)",
        ],
        ar: [
          "تصميمات لمنصات التواصل الاجتماعي (5 كريدت لكل تصميم)",
          "ريلز 5-10 ثوان (10 كريدت، +5 لكل 10 ثوان إضافية)",
          "التعديل الأول مجاني، 2 كريدت بعد ذلك",
          "أداء صوتي متاح (+5 كريدت)",
        ],
      },
      price: 100, // Set actual price
      credits: 30,
      durationDays: 30,
      isActive: true,
      supportAllServices: false,
      sortOrder: 1,
    } as any,
  });

  // Link services to Package 1
  await prisma.packageService.createMany({
    data: [
      { packageId: package1.id, serviceId: socialMediaDesign.id },
      { packageId: package1.id, serviceId: reelVideo.id },
      { packageId: package1.id, serviceId: voiceOver.id },
    ],
  });

  console.log("📦 Created Package 1 (30 Credits)");

  // Create Package 2 - 60 Credits (Standard)
  const package2 = await prisma.package.create({
    data: {
      name: "Standard Package - 60 Credits",
      nameI18n: { en: "Standard Package - 60 Credits", ar: "الباقة الثانية - 60 كريدت" },
      description:
        "Includes designs, reels, and logo. Suitable for small businesses and e-commerce.",
      descriptionI18n: {
        en: "Includes designs, reels, and logo. Suitable for small businesses and e-commerce.",
        ar: "تشمل التصميمات والريلز واللوجو. مناسبة للشركات الصغيرة والتجارة الإلكترونية.",
      },
      featuresI18n: {
        en: [
          "Social media designs (5 credits each)",
          "Reels 5-10 seconds (10 credits, +5 per extra 10 sec)",
          "Logo design (50 credits)",
          "Voice over available (+5 credits)",
          "First revision free, 2 credits after",
        ],
        ar: [
          "تصميمات لمنصات التواصل الاجتماعي (5 كريدت لكل تصميم)",
          "ريلز 5-10 ثوان (10 كريدت، +5 لكل 10 ثوان إضافية)",
          "تصميم لوجو (50 كريدت)",
          "أداء صوتي متاح (+5 كريدت)",
          "التعديل الأول مجاني، 2 كريدت بعد ذلك",
        ],
      },
      price: 200, // Set actual price
      credits: 60,
      durationDays: 30,
      isActive: true,
      supportAllServices: false,
      sortOrder: 2,
    } as any,
  });

  await prisma.packageService.createMany({
    data: [
      { packageId: package2.id, serviceId: socialMediaDesign.id },
      { packageId: package2.id, serviceId: reelVideo.id },
      { packageId: package2.id, serviceId: logoDesign.id },
      { packageId: package2.id, serviceId: voiceOver.id },
    ],
  });

  console.log("📦 Created Package 2 (60 Credits)");

  // Create Package 3 - 120 Credits (Premium)
  const package3 = await prisma.package.create({
    data: {
      name: "Premium Package - 120 Credits",
      nameI18n: { en: "Premium Package - 120 Credits", ar: "الباقة الثالثة - 120 كريدت" },
      description:
        "Includes designs, reels, logo, and digital QR menu. Suitable for cafes, restaurants, and medium businesses.",
      descriptionI18n: {
        en: "Includes designs, reels, logo, and digital QR menu. Suitable for cafes, restaurants, and medium businesses.",
        ar: "تشمل التصميمات والريلز واللوجو ومنيو QR ديجيتال. مناسبة للكافيهات والمطاعم والشركات المتوسطة.",
      },
      featuresI18n: {
        en: [
          "Social media designs (5 credits each)",
          "Reels 5-10 seconds (10 credits, +5 per extra 10 sec)",
          "Logo design (50 credits)",
          "Digital QR Menu (50 credits for 20 products, +1 per extra)",
          "Voice over available (+5 credits)",
          "First revision free, 2 credits after",
        ],
        ar: [
          "تصميمات لمنصات التواصل الاجتماعي (5 كريدت لكل تصميم)",
          "ريلز 5-10 ثوان (10 كريدت، +5 لكل 10 ثوان إضافية)",
          "تصميم لوجو (50 كريدت)",
          "منيو QR ديجيتال (50 كريدت لـ20 منتج، +1 لكل منتج إضافي)",
          "أداء صوتي متاح (+5 كريدت)",
          "التعديل الأول مجاني، 2 كريدت بعد ذلك",
        ],
      },
      price: 400, // Set actual price
      credits: 120,
      durationDays: 30,
      isActive: true,
      supportAllServices: false,
      sortOrder: 3,
    } as any,
  });

  await prisma.packageService.createMany({
    data: [
      { packageId: package3.id, serviceId: socialMediaDesign.id },
      { packageId: package3.id, serviceId: reelVideo.id },
      { packageId: package3.id, serviceId: logoDesign.id },
      { packageId: package3.id, serviceId: digitalMenu.id },
      { packageId: package3.id, serviceId: voiceOver.id },
    ],
  });

  console.log("📦 Created Package 3 (120 Credits)");

  // Create Package 4 - 300 Credits (Enterprise)
  const package4 = await prisma.package.create({
    data: {
      name: "Enterprise Package - 300 Credits",
      nameI18n: { en: "Enterprise Package - 300 Credits", ar: "الباقة الرابعة - 300 كريدت" },
      description:
        "All services included: designs, reels, logo, digital menu, and 2D/3D animations. Suitable for large companies.",
      descriptionI18n: {
        en: "All services included: designs, reels, logo, digital menu, and 2D/3D animations. Suitable for large companies.",
        ar: "جميع الخدمات مشمولة: التصميمات والريلز واللوجو والمنيو الرقمي وفيديوهات 2D/3D. مناسبة للشركات الكبيرة.",
      },
      featuresI18n: {
        en: [
          "Social media designs (5 credits each)",
          "Reels 5-10 seconds (10 credits, +5 per extra 10 sec)",
          "Logo design (50 credits)",
          "Digital QR Menu (50 credits for 20 products, +1 per extra)",
          "2D Animation (20 credits for 10 sec, +10 per extra 10 sec)",
          "3D Animation (40 credits for 10 sec, +15 per extra 10 sec)",
          "Voice over available (+5 credits)",
          "First revision free, 2 credits after",
        ],
        ar: [
          "تصميمات لمنصات التواصل الاجتماعي (5 كريدت لكل تصميم)",
          "ريلز 5-10 ثوان (10 كريدت، +5 لكل 10 ثوان إضافية)",
          "تصميم لوجو (50 كريدت)",
          "منيو QR ديجيتال (50 كريدت لـ20 منتج، +1 لكل منتج إضافي)",
          "فيديو انيميشن 2D (20 كريدت لـ10 ثوان، +10 لكل 10 ثوان إضافية)",
          "فيديو انيميشن 3D (40 كريدت لـ10 ثوان، +15 لكل 10 ثوان إضافية)",
          "أداء صوتي متاح (+5 كريدت)",
          "التعديل الأول مجاني، 2 كريدت بعد ذلك",
        ],
      },
      price: 1000, // Set actual price
      credits: 300,
      durationDays: 30,
      isActive: true,
      supportAllServices: false,
      sortOrder: 4,
    } as any,
  });

  await prisma.packageService.createMany({
    data: [
      { packageId: package4.id, serviceId: socialMediaDesign.id },
      { packageId: package4.id, serviceId: reelVideo.id },
      { packageId: package4.id, serviceId: logoDesign.id },
      { packageId: package4.id, serviceId: digitalMenu.id },
      { packageId: package4.id, serviceId: animation2D.id },
      { packageId: package4.id, serviceId: animation3D.id },
      { packageId: package4.id, serviceId: voiceOver.id },
    ],
  });

  console.log("📦 Created Package 4 (300 Credits)");

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Admin Account:");
  console.log("─".repeat(50));
  console.log("Super Admin:  nabraagency20@gmail.com / Nabra@2020#Alaa");
  console.log("─".repeat(50));
  console.log("\n📦 Packages Created:");
  console.log("─".repeat(50));
  console.log("Free Plan:         1 credit   (14 days) - $0");
  console.log("Basic Package:    30 credits  (30 days) - $100");
  console.log("Standard Package: 60 credits  (30 days) - $200");
  console.log("Premium Package:  120 credits (30 days) - $400");
  console.log("Enterprise Package: 300 credits (30 days) - $1000");
  console.log("─".repeat(50));
  console.log("\n🎨 Service Types Created:");
  console.log("─".repeat(50));
  console.log("1. Social Media Design (5 credits)");
  console.log("2. Reel Video 5-10s (10 credits + 5/extra 10s)");
  console.log("3. Logo Design (50 credits)");
  console.log("4. Voice Over Arabic (5 credits)");
  console.log("5. Digital QR Menu (50 credits + 1/product after 20)");
  console.log("6. 2D Animation (20 credits + 10/extra 10s)");
  console.log("7. 3D Animation (40 credits + 15/extra 10s)");
  console.log("─".repeat(50));
  console.log("\n💡 New clients will automatically receive the free plan upon registration.");
  console.log("💡 All services follow the revision policy: First revision free, 2 credits after.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
