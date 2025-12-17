import { z } from "zod";
import { router, protectedProcedure, clientProcedure, adminProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { PaymentStatus } from "@prisma/client";
import { notifyAdminsNewPendingPayment } from "@/lib/notifications";

export const paymentRouter = router({
  // Get IBAN info for payment (public info clients need)
  getPaymentInfo: protectedProcedure.query(async () => {
    // In production, this could come from database settings
    return {
      bankName: "International Bank",
      accountName: "Nabra AI System",
      iban: "DE89 3704 0044 0532 0130 00", // Example IBAN
      swiftCode: "COBADEFFXXX",
      currency: "USD",
      note: "Please include your email address in the transfer reference for faster verification.",
    };
  }),

  // Client submits payment proof
  submitProof: clientProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        transferImage: z.string().min(1, "Transfer image is required"),
        senderName: z.string().min(2),
        senderBank: z.string().min(2),
        senderCountry: z.string().min(2),
        amount: z.number().positive(),
        currency: z.string().default("USD"),
        transferDate: z.date(),
        referenceNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify the subscription belongs to this user
      const subscription = await ctx.db.clientSubscription.findFirst({
        where: {
          id: input.subscriptionId,
          userId,
        },
        include: {
          paymentProof: true,
        },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }

      if (subscription.paymentProof) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Payment proof already submitted for this subscription",
        });
      }

      // Create payment proof
      const paymentProof = await ctx.db.paymentProof.create({
        data: {
          subscriptionId: input.subscriptionId,
          userId,
          transferImage: input.transferImage,
          senderName: input.senderName,
          senderBank: input.senderBank,
          senderCountry: input.senderCountry,
          amount: input.amount,
          currency: input.currency,
          transferDate: input.transferDate,
          referenceNumber: input.referenceNumber,
          notes: input.notes,
          status: PaymentStatus.PENDING,
        },
      });

      // Notify admins (DB + SSE)
      await notifyAdminsNewPendingPayment({
        clientNameOrEmail: ctx.session.user.name || ctx.session.user.email,
        amount: input.amount,
        currency: input.currency,
      });

      return paymentProof;
    }),

  // Get payment proof for a subscription (client)
  getMyPaymentProof: clientProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return ctx.db.paymentProof.findFirst({
        where: {
          subscriptionId: input.subscriptionId,
          userId,
        },
      });
    }),

  // Get all pending payments (admin)
  getPendingPayments: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.paymentProof.findMany({
      where: {
        status: PaymentStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscription: {
          include: {
            package: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }),

  // Get all payments with filters (admin)
  getAllPayments: adminProcedure
    .input(
      z.object({
        status: z.nativeEnum(PaymentStatus).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const payments = await ctx.db.paymentProof.findMany({
        where: input.status ? { status: input.status } : undefined,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          subscription: {
            include: {
              package: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (payments.length > input.limit) {
        const nextItem = payments.pop();
        nextCursor = nextItem!.id;
      }

      return {
        payments,
        nextCursor,
      };
    }),

  // Approve payment (admin)
  approvePayment: adminProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;

      const payment = await ctx.db.paymentProof.findUnique({
        where: { id: input.paymentId },
        include: {
          subscription: {
            include: {
              package: true,
            },
          },
          user: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment proof not found",
        });
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This payment has already been reviewed",
        });
      }

      // Update payment status
      await ctx.db.paymentProof.update({
        where: { id: input.paymentId },
        data: {
          status: PaymentStatus.APPROVED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // Activate the subscription
      await ctx.db.clientSubscription.update({
        where: { id: payment.subscriptionId },
        data: {
          isActive: true,
          startDate: new Date(),
          endDate: new Date(
            Date.now() + payment.subscription.package.durationDays * 24 * 60 * 60 * 1000
          ),
        },
      });

      // Notify the user
      await ctx.db.notification.create({
        data: {
          userId: payment.userId,
          title: "Payment Approved! 🎉",
          message: `Your payment has been verified. Your ${payment.subscription.package.name} subscription is now active!`,
          type: "payment",
          link: "/client/subscription",
        },
      });

      return { success: true };
    }),

  // Reject payment (admin)
  rejectPayment: adminProcedure
    .input(
      z.object({
        paymentId: z.string(),
        reason: z.string().min(10, "Please provide a detailed reason for rejection"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;

      const payment = await ctx.db.paymentProof.findUnique({
        where: { id: input.paymentId },
        include: {
          subscription: {
            include: {
              package: true,
            },
          },
          user: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment proof not found",
        });
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This payment has already been reviewed",
        });
      }

      // Update payment status
      await ctx.db.paymentProof.update({
        where: { id: input.paymentId },
        data: {
          status: PaymentStatus.REJECTED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: input.reason,
        },
      });

      // Deactivate the subscription (it was pending anyway)
      await ctx.db.clientSubscription.update({
        where: { id: payment.subscriptionId },
        data: {
          isActive: false,
          cancelledAt: new Date(),
        },
      });

      // Notify the user
      await ctx.db.notification.create({
        data: {
          userId: payment.userId,
          title: "Payment Verification Failed",
          message: `Your payment could not be verified. Reason: ${input.reason}. Please contact support or try again.`,
          type: "payment",
          link: "/client/subscription",
        },
      });

      return { success: true };
    }),

  // Get payment stats for admin dashboard
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [pending, approved, rejected, total] = await Promise.all([
      ctx.db.paymentProof.count({ where: { status: PaymentStatus.PENDING } }),
      ctx.db.paymentProof.count({ where: { status: PaymentStatus.APPROVED } }),
      ctx.db.paymentProof.count({ where: { status: PaymentStatus.REJECTED } }),
      ctx.db.paymentProof.count(),
    ]);

    return { pending, approved, rejected, total };
  }),
});
