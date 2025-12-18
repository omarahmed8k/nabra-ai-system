import { z } from "zod";
import { router, protectedProcedure, clientProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { getCreditBalance } from "@/lib/credit-logic";

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

    // Calculate expiry info inline to avoid extra DB call
    const now = Date.now();
    const endDate = new Date(subscription.endDate).getTime();
    const diffTime = endDate - now;
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      ...subscription,
      isExpiring: daysRemaining <= 7,
      daysRemaining,
    };
  }),

  // Get pending subscription awaiting payment verification
  getPending: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const subscription = await ctx.db.clientSubscription.findFirst({
      where: {
        userId,
        isActive: false,
        cancelledAt: null,
      },
      include: {
        package: true,
        paymentProof: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return subscription;
  }),

  // Get credit balance and stats
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return getCreditBalance(userId);
  }),

  // Subscribe to a package (creates pending subscription awaiting payment)
  subscribe: clientProcedure
    .input(
      z.object({
        packageId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

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

      // If it's the free package, prevent resubscription
      if (pkg.isFreePackage) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "The free package is only available during registration. It cannot be resubscribed.",
        });
      }

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
          message:
            "You already have an active subscription. Please cancel it first or wait for it to expire.",
        });
      }

      // Check for pending payment subscription
      const pendingSubscription = await ctx.db.clientSubscription.findFirst({
        where: {
          userId,
          isActive: false,
          cancelledAt: null,
          paymentProof: {
            status: "PENDING",
          },
        },
        include: {
          paymentProof: true,
        },
      });

      if (pendingSubscription) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "You have a pending subscription awaiting payment verification. Please wait for it to be processed.",
        });
      }

      // Create subscription as INACTIVE (pending payment verification)
      const now = new Date();
      const endDate = new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000);

      const subscription = await ctx.db.clientSubscription.create({
        data: {
          userId,
          packageId: pkg.id,
          remainingCredits: pkg.credits,
          startDate: now,
          endDate,
          isActive: false, // Will be activated after payment verification
        },
        include: {
          package: true,
        },
      });

      return {
        success: true,
        subscription,
        requiresPayment: true,
        message: `Please complete the payment for ${pkg.name} to activate your subscription.`,
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
          cancelledAt: null, // Not already cancelled
        },
        include: {
          package: true,
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
          message: subscription.isActive
            ? "Your subscription has been cancelled. You can still use remaining credits until the end date."
            : "Your pending subscription has been cancelled.",
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

  // Get transaction history (subscriptions with payment proofs)
  getTransactionHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const subscriptions = await ctx.db.clientSubscription.findMany({
      where: { userId },
      include: {
        package: true,
        paymentProof: {
          include: {
            reviewer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return subscriptions.map((sub) => ({
      id: sub.id,
      type: "subscription" as const,
      packageName: sub.package.name,
      packagePrice: sub.package.price,
      credits: sub.package.credits,
      remainingCredits: sub.remainingCredits,
      startDate: sub.startDate,
      endDate: sub.endDate,
      isActive: sub.isActive,
      isFreePackage: sub.package.isFreePackage,
      cancelledAt: sub.cancelledAt,
      createdAt: sub.createdAt,
      paymentProof: sub.paymentProof
        ? {
            id: sub.paymentProof.id,
            amount: sub.paymentProof.amount,
            currency: sub.paymentProof.currency,
            status: sub.paymentProof.status,
            transferDate: sub.paymentProof.transferDate,
            senderName: sub.paymentProof.senderName,
            senderBank: sub.paymentProof.senderBank,
            senderCountry: sub.paymentProof.senderCountry,
            referenceNumber: sub.paymentProof.referenceNumber,
            reviewedAt: sub.paymentProof.reviewedAt,
            reviewedBy: sub.paymentProof.reviewer?.name,
            rejectionReason: sub.paymentProof.rejectionReason,
          }
        : null,
    }));
  }),
});
