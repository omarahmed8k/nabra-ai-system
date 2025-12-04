import { z } from "zod";
import bcrypt from "bcryptjs";
import { router, publicProcedure, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

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

      const hashedPassword = await bcrypt.hash(input.password, 12);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: "CLIENT", // Default role
        },
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
