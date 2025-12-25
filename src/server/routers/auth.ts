import { z } from "zod";
import bcrypt from "bcryptjs";
import { router, publicProcedure, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { sendWelcomeEmail } from "@/lib/notifications";
import { phoneWithCountryCodeSchema } from "@/lib/validations";

export const authRouter = router({
  // Register a new user
  register: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/register",
        tags: ["auth"],
        summary: "Register a new user",
      },
    })
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address").toLowerCase(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        phone: phoneWithCountryCodeSchema,
        hasWhatsapp: z.boolean().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      // Capture IP for audit, but do not restrict by IP
      const forwarded =
        ctx.req && "headers" in ctx.req && typeof (ctx.req as any).headers?.get === "function"
          ? (ctx.req as any).headers.get("x-forwarded-for")
          : (ctx.req as any)?.headers?.["x-forwarded-for"];

      const realIp =
        ctx.req && "headers" in ctx.req && typeof (ctx.req as any).headers?.get === "function"
          ? (ctx.req as any).headers.get("x-real-ip")
          : (ctx.req as any)?.headers?.["x-real-ip"];

      const forwardedString = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      const realIpString = Array.isArray(realIp) ? realIp[0] : realIp;
      const ip = forwardedString?.split(",")[0] || realIpString || null;

      const hashedPassword = await bcrypt.hash(input.password, 12);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          phone: input.phone || null,
          hasWhatsapp: input.hasWhatsapp ?? false,
          role: "CLIENT", // Default role
          registrationIp: ip,
        },
      });

      // Automatically subscribe user to free package
      const freePackage = await ctx.db.package.findFirst({
        where: {
          isFreePackage: true,
          isActive: true,
        },
      });

      if (freePackage) {
        const now = new Date();
        const endDate = new Date(Date.now() + freePackage.durationDays * 24 * 60 * 60 * 1000);

        await ctx.db.clientSubscription.create({
          data: {
            userId: user.id,
            packageId: freePackage.id,
            remainingCredits: freePackage.credits,
            startDate: now,
            endDate,
            isActive: true, // Free package is immediately active
            isFreeTrialUsed: true, // Mark as free trial used so can't resubscribe
          },
        });
      }

      // Send welcome email (non-blocking)
      sendWelcomeEmail({
        userId: user.id,
        userName: user.name || "User",
        userEmail: user.email,
        userRole: user.role,
        locale: ctx.locale,
      }).catch((error) => {
        console.error("Failed to send welcome email:", error);
        // Don't throw - email failure shouldn't break registration
      });

      return {
        success: true,
        message: "Account created successfully",
        userId: user.id,
      };
    }),

  // Get current session
  getSession: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/auth/session",
        tags: ["auth"],
        summary: "Get current session",
      },
    })
    .output(
      z
        .object({
          user: z
            .object({
              id: z.string(),
              name: z.string().nullable().optional(),
              email: z.string().email().nullable().optional(),
              role: z.string().nullable().optional(),
              image: z.string().url().nullable().optional(),
            })
            .nullable()
            .optional(),
        })
        .nullable()
    )
    .query(async ({ ctx }) => {
      return ctx.session as any;
    }),

  // Get current user profile
  getProfile: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/auth/profile",
        tags: ["auth"],
        summary: "Get current user profile",
      },
    })
    .output(
      z.object({
        id: z.string(),
        name: z.string().nullable().optional(),
        email: z.string().email(),
        role: z.string(),
        image: z.string().url().nullable().optional(),
        createdAt: z.date(),
        providerProfile: z.any().nullable().optional(),
      })
    )
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: {
          providerProfile: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt,
        providerProfile: user.providerProfile,
      };
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .meta({
      openapi: {
        method: "PUT",
        path: "/auth/profile",
        tags: ["auth"],
        summary: "Update current user profile",
      },
    })
    .input(
      z.object({
        name: z.string().min(2).optional(),
        image: z.string().url().optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        user: z.object({
          id: z.string(),
          name: z.string().nullable().optional(),
          email: z.string().email(),
          image: z.string().url().nullable().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          image: input.image,
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      };
    }),

  // Change password
  changePassword: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/change-password",
        tags: ["auth"],
        summary: "Change current user password",
      },
    })
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user?.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change password for OAuth accounts",
        });
      }

      const isValid = await bcrypt.compare(input.currentPassword, user.password);

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 12);

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        message: "Password changed successfully",
      };
    }),
});
