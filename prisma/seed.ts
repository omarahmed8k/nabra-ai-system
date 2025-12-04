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

  // Create Packages
  const packages = await Promise.all([
    prisma.package.create({
      data: {
        name: "Starter",
        description: "Perfect for individuals and small projects",
        credits: 5,
        price: 49,
        durationDays: 30,
        maxFreeRevisions: 2,
        features: [
          "5 request credits",
          "2 free revisions per request",
          "Email support",
          "48-hour response time",
        ],
        sortOrder: 1,
      },
    }),
    prisma.package.create({
      data: {
        name: "Professional",
        description: "Best for growing businesses",
        credits: 20,
        price: 149,
        durationDays: 30,
        maxFreeRevisions: 3,
        features: [
          "20 request credits",
          "3 free revisions per request",
          "Priority support",
          "24-hour response time",
          "Dedicated account manager",
        ],
        sortOrder: 2,
      },
    }),
    prisma.package.create({
      data: {
        name: "Enterprise",
        description: "For large teams and agencies",
        credits: 50,
        price: 299,
        durationDays: 30,
        maxFreeRevisions: 5,
        features: [
          "50 request credits",
          "5 free revisions per request",
          "24/7 priority support",
          "12-hour response time",
          "Dedicated account manager",
          "Custom integrations",
          "API access",
        ],
        sortOrder: 3,
      },
    }),
  ]);

  console.log("📦 Created packages:", packages.length);

  // Create Service Types
  const serviceTypes = await Promise.all([
    prisma.serviceType.create({
      data: {
        name: "Web Development",
        description: "Custom websites, web applications, and landing pages",
        icon: "🌐",
        formFields: JSON.stringify({
          fields: [
            {
              name: "projectType",
              type: "select",
              label: "Project Type",
              required: true,
              options: ["Landing Page", "E-commerce", "Web App", "Portfolio", "Blog"],
            },
            {
              name: "pages",
              type: "number",
              label: "Number of Pages",
              required: true,
              min: 1,
              max: 50,
            },
            {
              name: "features",
              type: "textarea",
              label: "Required Features",
              required: false,
            },
          ],
        }),
        sortOrder: 1,
      },
    }),
    prisma.serviceType.create({
      data: {
        name: "Graphic Design",
        description: "Logos, branding, marketing materials, and illustrations",
        icon: "🎨",
        formFields: JSON.stringify({
          fields: [
            {
              name: "designType",
              type: "select",
              label: "Design Type",
              required: true,
              options: ["Logo", "Business Card", "Flyer", "Social Media", "Banner", "Brochure"],
            },
            {
              name: "dimensions",
              type: "text",
              label: "Dimensions",
              required: false,
            },
            {
              name: "colorPreferences",
              type: "text",
              label: "Color Preferences",
              required: false,
            },
          ],
        }),
        sortOrder: 2,
      },
    }),
    prisma.serviceType.create({
      data: {
        name: "Video Production",
        description: "Video editing, motion graphics, and animations",
        icon: "🎬",
        formFields: JSON.stringify({
          fields: [
            {
              name: "videoType",
              type: "select",
              label: "Video Type",
              required: true,
              options: ["Promo Video", "Explainer", "Social Media Clip", "Animation", "Documentary"],
            },
            {
              name: "duration",
              type: "number",
              label: "Duration (seconds)",
              required: true,
              min: 15,
              max: 600,
            },
            {
              name: "hasVoiceover",
              type: "checkbox",
              label: "Include Voiceover",
              required: false,
            },
          ],
        }),
        sortOrder: 3,
      },
    }),
    prisma.serviceType.create({
      data: {
        name: "Content Writing",
        description: "Blog posts, copywriting, and SEO content",
        icon: "✍️",
        formFields: JSON.stringify({
          fields: [
            {
              name: "contentType",
              type: "select",
              label: "Content Type",
              required: true,
              options: ["Blog Post", "Website Copy", "Product Description", "Email Campaign", "Social Media"],
            },
            {
              name: "wordCount",
              type: "number",
              label: "Word Count",
              required: true,
              min: 100,
              max: 5000,
            },
            {
              name: "tone",
              type: "select",
              label: "Tone",
              required: true,
              options: ["Professional", "Casual", "Friendly", "Authoritative", "Playful"],
            },
          ],
        }),
        sortOrder: 4,
      },
    }),
    prisma.serviceType.create({
      data: {
        name: "UI/UX Design",
        description: "User interface design and user experience optimization",
        icon: "📱",
        formFields: JSON.stringify({
          fields: [
            {
              name: "platform",
              type: "select",
              label: "Platform",
              required: true,
              options: ["Web", "iOS", "Android", "Cross-platform"],
            },
            {
              name: "screens",
              type: "number",
              label: "Number of Screens",
              required: true,
              min: 1,
              max: 100,
            },
            {
              name: "includePrototype",
              type: "checkbox",
              label: "Include Interactive Prototype",
              required: false,
            },
          ],
        }),
        sortOrder: 5,
      },
    }),
  ]);

  console.log("🛠️ Created service types:", serviceTypes.length);

  // Create Users
  const hashedAdminPassword = await bcrypt.hash("admin123456", 12);
  const hashedProviderPassword = await bcrypt.hash("provider123", 12);
  const hashedClientPassword = await bcrypt.hash("client123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@nabra.com",
      password: hashedAdminPassword,
      role: "SUPER_ADMIN",
    },
  });

  const designer = await prisma.user.create({
    data: {
      name: "Alex Designer",
      email: "designer@nabra.com",
      password: hashedProviderPassword,
      role: "PROVIDER",
      providerProfile: {
        create: {
          bio: "Professional graphic designer with 8+ years of experience in branding, UI/UX, and illustration.",
          portfolio: "https://dribbble.com/alexdesigner",
          skillsTags: ["Graphic Design", "UI/UX Design", "Logo Design", "Branding"],
        },
      },
    },
  });

  const developer = await prisma.user.create({
    data: {
      name: "Sam Developer",
      email: "developer@nabra.com",
      password: hashedProviderPassword,
      role: "PROVIDER",
      providerProfile: {
        create: {
          bio: "Full-stack developer specializing in React, Next.js, and Node.js. Building scalable web applications.",
          portfolio: "https://github.com/samdev",
          skillsTags: ["Web Development", "React", "Next.js", "Node.js", "TypeScript"],
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      name: "Jordan Video",
      email: "video@nabra.com",
      password: hashedProviderPassword,
      role: "PROVIDER",
      providerProfile: {
        create: {
          bio: "Video editor and motion graphics artist. Creating stunning visuals for brands worldwide.",
          portfolio: "https://vimeo.com/jordanvideo",
          skillsTags: ["Video Production", "Motion Graphics", "Animation", "After Effects"],
        },
      },
    },
  });

  const client = await prisma.user.create({
    data: {
      name: "Chris Client",
      email: "client@example.com",
      password: hashedClientPassword,
      role: "CLIENT",
    },
  });

  const client2 = await prisma.user.create({
    data: {
      name: "Taylor Business",
      email: "taylor@company.com",
      password: hashedClientPassword,
      role: "CLIENT",
    },
  });

  console.log("👥 Created users:", 6);

  // Create Subscriptions for clients
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.clientSubscription.create({
    data: {
      userId: client.id,
      packageId: packages[1].id, // Professional
      remainingCredits: 18,
      startDate: now,
      endDate: thirtyDaysLater,
      isActive: true,
    },
  });

  await prisma.clientSubscription.create({
    data: {
      userId: client2.id,
      packageId: packages[2].id, // Enterprise
      remainingCredits: 45,
      startDate: now,
      endDate: thirtyDaysLater,
      isActive: true,
    },
  });

  console.log("📋 Created subscriptions:", 2);

  // Create Sample Requests
  const request1 = await prisma.request.create({
    data: {
      title: "Company Website Redesign",
      description:
        "We need a complete redesign of our company website. The current design is outdated and not mobile-friendly. We want a modern, clean look with improved navigation and faster loading times.",
      clientId: client.id,
      providerId: developer.id,
      serviceTypeId: serviceTypes[0].id, // Web Development
      status: "IN_PROGRESS",
      priority: 3,
      formData: JSON.stringify({
        projectType: "Web App",
        pages: 8,
        features: "Contact form, Blog section, Admin dashboard, Newsletter signup",
      }),
      estimatedDelivery: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      currentRevisionCount: 1,
      totalRevisions: 1,
    },
  });

  const request2 = await prisma.request.create({
    data: {
      title: "New Logo Design",
      description:
        "Looking for a fresh, modern logo for our tech startup. We want something minimalist that works well on both light and dark backgrounds.",
      clientId: client.id,
      providerId: designer.id,
      serviceTypeId: serviceTypes[1].id, // Graphic Design
      status: "DELIVERED",
      priority: 2,
      formData: JSON.stringify({
        designType: "Logo",
        dimensions: "Vector (SVG)",
        colorPreferences: "Blue, White, minimal colors",
      }),
      estimatedDelivery: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      currentRevisionCount: 2,
      totalRevisions: 2,
    },
  });

  await prisma.request.create({
    data: {
      title: "Product Launch Video",
      description:
        "We're launching a new SaaS product and need a 60-second promo video. Should be energetic, modern, and highlight key features.",
      clientId: client2.id,
      serviceTypeId: serviceTypes[2].id, // Video Production
      status: "PENDING",
      priority: 3,
      formData: JSON.stringify({
        videoType: "Promo Video",
        duration: 60,
        hasVoiceover: true,
      }),
    },
  });

  const request4 = await prisma.request.create({
    data: {
      title: "Blog Content Series",
      description:
        "Need a series of 5 blog posts about AI in business. Each post should be around 1500 words, SEO-optimized.",
      clientId: client2.id,
      providerId: developer.id, // Reusing for demo
      serviceTypeId: serviceTypes[3].id, // Content Writing
      status: "COMPLETED",
      priority: 1,
      formData: JSON.stringify({
        contentType: "Blog Post",
        wordCount: 1500,
        tone: "Professional",
      }),
      completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      currentRevisionCount: 0,
      totalRevisions: 3,
    },
  });

  console.log("📝 Created requests:", 4);

  // Create Comments for requests
  await prisma.requestComment.createMany({
    data: [
      {
        requestId: request1.id,
        userId: client.id,
        content: "Hi! I've attached some references for the design direction we're looking for.",
        type: "MESSAGE",
      },
      {
        requestId: request1.id,
        userId: developer.id,
        content: "Thanks for the references! I'll start with wireframes and share them by tomorrow.",
        type: "MESSAGE",
      },
      {
        requestId: request1.id,
        userId: developer.id,
        content: "Started working on the project. Setting up the development environment.",
        type: "SYSTEM",
      },
      {
        requestId: request2.id,
        userId: designer.id,
        content: "Here are 3 logo concepts based on your requirements. Please review and let me know which direction you prefer.",
        type: "DELIVERABLE",
        files: ["https://cdn.nabra.com/deliverables/logo-concepts-v1.pdf"],
      },
      {
        requestId: request2.id,
        userId: client.id,
        content: "Love concept #2! Can we try a few variations with different blue shades?",
        type: "MESSAGE",
      },
    ],
  });

  console.log("💬 Created comments:", 5);

  // Create Rating for completed request
  await prisma.rating.create({
    data: {
      requestId: request4.id,
      clientId: client2.id,
      providerId: developer.id,
      rating: 5,
      reviewText:
        "Excellent work! The blog posts were well-researched, engaging, and perfectly captured our brand voice. Will definitely work with Sam again!",
    },
  });

  console.log("⭐ Created ratings:", 1);

  // Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: client.id,
        title: "Deliverable Ready",
        message: "Alex Designer has uploaded new logo concepts for your review.",
        type: "request",
        link: `/client/requests/${request2.id}`,
      },
      {
        userId: developer.id,
        title: "New Request Available",
        message: "A new Product Launch Video request is waiting for a provider.",
        type: "request",
        link: `/provider/requests`,
      },
      {
        userId: admin.id,
        title: "System Alert",
        message: "Monthly subscription renewals processed: 2 active subscriptions.",
        type: "system",
      },
    ],
  });

  console.log("🔔 Created notifications:", 3);

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Test Accounts:");
  console.log("─".repeat(50));
  console.log("Super Admin:  admin@nabra.com      / admin123456");
  console.log("Designer:     designer@nabra.com   / provider123");
  console.log("Developer:    developer@nabra.com  / provider123");
  console.log("Video Editor: video@nabra.com      / provider123");
  console.log("Client:       client@example.com   / client123");
  console.log("Client 2:     taylor@company.com   / client123");
  console.log("─".repeat(50));
}

try {
  await main();
  await prisma.$disconnect();
} catch (e) {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
}
