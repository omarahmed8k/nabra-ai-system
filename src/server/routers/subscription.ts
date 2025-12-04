import { z } from "zod";
import { router, protectedProcedure, clientProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { getCreditBalance, checkSubscriptionExpiry } from "@/lib/credit-logic";

export const subscriptionRouter = router({
  // Get active subscription for current user
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const subscription = await ctx.db.clientSubscription.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: { gte: new Date() },
      },
      include: {
        package: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return null;
    }

    const expiryInfo = await checkSubscriptionExpiry(userId);

    return {
      ...subscription,
      isExpiring: expiryInfo.isExpiring,
      daysRemaining: expiryInfo.daysRemaining,
    };
  }),

  // Get credit balance and stats
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return getCreditBalance(userId);
  }),

  // Subscribe to a package
  subscribe: clientProcedure
    .input(
      z.object({
        packageId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check for existing active subscription
      const existingSubscription = await ctx.db.clientSubscription.findFirst({
        where: {
          userId,
          isActive: true,
          endDate: { gte: new Date() },
        },
      });

      if (existingSubscription) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have an active subscription. Please cancel it first or wait for it to expire.",
        });
      }

      // Get the package
      const pkg = await ctx.db.package.findUnique({
        where: { id: input.packageId, isActive: true },
      });

      if (!pkg) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found or inactive",
        });
      }

      // In production, you would integrate with Stripe here
      // For now, we'll create the subscription directly

      const now = new Date();
      const endDate = new Date(now.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);

      const subscription = await ctx.db.clientSubscription.create({
        data: {
          userId,
          packageId: pkg.id,
          remainingCredits: pkg.credits,
          startDate: now,
          endDate,
          isActive: true,
        },
        include: {
          package: true,
        },
      });

      // Create notification
      await ctx.db.notification.create({
        data: {
          userId,
          title: "Subscription Activated",
          message: `Your ${pkg.name} subscription is now active with ${pkg.credits} credits!`,
          type: "subscription",
        },
      });

      return {
        success: true,
        subscription,
        message: `Successfully subscribed to ${pkg.name}. You have ${pkg.credits} credits.`,
      };
    }),

  // Cancel subscription
  cancel: clientProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const subscription = await ctx.db.clientSubscription.findFirst({
        where: {
          id: input.subscriptionId,
          userId,
          isActive: true,
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found or already cancelled",
        });
      }

      const updatedSubscription = await ctx.db.clientSubscription.update({
        where: { id: input.subscriptionId },
        data: {
          isActive: false,
          cancelledAt: new Date(),
        },
      });

      // Create notification
      await ctx.db.notification.create({
        data: {
          userId,
          title: "Subscription Cancelled",
          message: "Your subscription has been cancelled. You can still use remaining credits until the end date.",
          type: "subscription",
        },
      });

      return {
        success: true,
        subscription: updatedSubscription,
      };
    }),

  // Get usage statistics
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const subscription = await ctx.db.clientSubscription.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        package: true,
      },
    });

    if (!subscription) {
      return null;
    }

    // Get request stats for this user
    const totalRequests = await ctx.db.request.count({
      where: { clientId: userId },
    });

    const completedRequests = await ctx.db.request.count({
      where: { clientId: userId, status: "COMPLETED" },
    });

    const activeRequests = await ctx.db.request.count({
      where: {
        clientId: userId,
        status: { in: ["PENDING", "IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED"] },
      },
    });

    const creditsUsed = subscription.package.credits - subscription.remainingCredits;

    return {
      totalRequests,
      completedRequests,
      activeRequests,
      creditsTotal: subscription.package.credits,
      creditsUsed,
      creditsRemaining: subscription.remainingCredits,
      subscriptionStartDate: subscription.startDate,
      subscriptionEndDate: subscription.endDate,
      packageName: subscription.package.name,
    };
  }),

  // Get subscription history
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const subscriptions = await ctx.db.clientSubscription.findMany({
      where: { userId },
      include: {
        package: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return subscriptions;
  }),
});
