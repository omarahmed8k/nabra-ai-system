import { z } from "zod";
import bcrypt from "bcryptjs";
import { router, publicProcedure, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { sendWelcomeEmail } from "@/lib/notifications";

export const authRouter = router({
  // Register a new user
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
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

      // Get IP address from request headers
      const forwarded = ctx.req?.headers.get("x-forwarded-for");
      const realIp = ctx.req?.headers.get("x-real-ip");
      const ip = forwarded?.split(",")[0] || realIp || null;

      // Check if IP has already registered to prevent free plan abuse
      if (ip) {
        const ipAlreadyRegistered = await ctx.db.user.findFirst({
          where: {
            registrationIp: ip,
            deletedAt: null,
          },
        });

        if (ipAlreadyRegistered) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "An account has already been registered from this network. Please contact support if you need assistance.",
          });
        }
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
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
  getSession: publicProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),

  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
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
    .input(
      z.object({
        name: z.string().min(2).optional(),
        image: z.string().url().optional(),
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
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
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
