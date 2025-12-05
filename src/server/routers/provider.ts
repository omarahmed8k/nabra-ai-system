import { z } from "zod";
import { router, providerProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";

export const providerRouter = router({
  // Get provider profile
  getProfile: providerProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const profile = await ctx.db.providerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, createdAt: true },
        },
      },
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Provider profile not found",
      });
    }

    return profile;
  }),

  // Update provider profile
  updateProfile: providerProcedure
    .input(
      z.object({
        bio: z.string().optional(),
        portfolio: z.string().url().optional().or(z.literal("")),
        skillsTags: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const profile = await ctx.db.providerProfile.upsert({
        where: { userId },
        update: input,
        create: {
          userId,
          ...input,
        },
      });

      return {
        success: true,
        profile,
      };
    }),

  // Get provider stats
  getStats: providerProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [
      totalRequests,
      completedRequests,
      activeRequests,
      pendingRequests,
      ratings,
    ] = await Promise.all([
      ctx.db.request.count({ where: { providerId: userId } }),
      ctx.db.request.count({ where: { providerId: userId, status: "COMPLETED" } }),
      ctx.db.request.count({
        where: {
          providerId: userId,
          status: { in: ["IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED"] },
        },
      }),
      ctx.db.request.count({
        where: { providerId: null, status: "PENDING" },
      }),
      ctx.db.rating.aggregate({
        where: { providerId: userId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return {
      totalRequests,
      completedRequests,
      activeRequests,
      pendingRequests,
      averageRating: ratings._avg.rating || 0,
      totalRatings: ratings._count,
    };
  }),

  // Get available requests (pending, matching provider's supported services)
  getAvailableRequests: providerProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get provider's supported services
      const providerProfile = await ctx.db.providerProfile.findUnique({
        where: { userId },
        include: {
          supportedServices: {
            select: { id: true },
          },
        },
      });

      // Get the service IDs this provider supports
      const supportedServiceIds = providerProfile?.supportedServices.map((s: { id: string }) => s.id) || [];

      // If no supported services configured, return empty (provider must have services assigned)
      if (supportedServiceIds.length === 0) {
        return {
          requests: [],
          nextCursor: null,
        };
      }

      // Build the where clause - only show requests matching provider's services
      const whereClause = {
        status: "PENDING" as const,
        providerId: null,
        serviceTypeId: { in: supportedServiceIds },
      };

      const requests = await ctx.db.request.findMany({
        where: whereClause,
        include: {
          client: {
            select: { id: true, name: true, image: true },
          },
          serviceType: true,
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "asc" },
        ],
        take: input?.limit || 20,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        skip: input?.cursor ? 1 : 0,
      });

      return {
        requests,
        nextCursor: requests.length === (input?.limit || 20) ? requests.at(-1)?.id ?? null : null,
      };
    }),

  // Get my requests (as provider)
  getMyRequests: providerProcedure
    .input(
      z.object({
        status: z.enum(["IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED", "COMPLETED"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const where: any = { providerId: userId };
      if (input?.status) {
        where.status = input.status;
      }

      const requests = await ctx.db.request.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, email: true, image: true },
          },
          serviceType: true,
          rating: true,
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: input?.limit || 20,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        skip: input?.cursor ? 1 : 0,
      });

      return {
        requests,
        nextCursor: requests.length === (input?.limit || 20) ? requests.at(-1)?.id ?? null : null,
      };
    }),

  // Get earnings summary
  getEarnings: providerProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const startDate = input?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input?.endDate || new Date();

      const completedRequests = await ctx.db.request.findMany({
        where: {
          providerId: userId,
          status: "COMPLETED",
          completedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          serviceType: true,
        },
      });

      // For demo purposes, assign a base value per request
      // In production, this would come from actual pricing
      const baseValuePerRequest = 50;
      const totalEarnings = completedRequests.length * baseValuePerRequest;

      return {
        totalEarnings,
        completedCount: completedRequests.length,
        period: {
          start: startDate,
          end: endDate,
        },
        requests: completedRequests,
      };
    }),

  // Get recent reviews
  getReviews: providerProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const reviews = await ctx.db.rating.findMany({
        where: { providerId: userId },
        include: {
          client: {
            select: { id: true, name: true, image: true },
          },
          request: {
            select: { id: true, title: true, serviceType: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit || 10,
      });

      return reviews;
    }),

  // Claim a request
  claimRequest: providerProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const request = await ctx.db.request.findUnique({
        where: { id: input.requestId },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.providerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This request has already been claimed",
        });
      }

      if (request.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending requests can be claimed",
        });
      }

      const updatedRequest = await ctx.db.request.update({
        where: { id: input.requestId },
        data: { providerId: userId },
      });

      // Notify client
      await ctx.db.notification.create({
        data: {
          userId: request.clientId,
          type: "REQUEST_CLAIMED",
          title: "Provider Assigned",
          message: `A provider has been assigned to your request "${request.title}"`,
          link: `/client/requests/${request.id}`,
        },
      });

      return { success: true, request: updatedRequest };
    }),

  // Start working on a request
  startWork: providerProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const request = await ctx.db.request.findUnique({
        where: { id: input.requestId },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.providerId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to this request",
        });
      }

      if (request.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending requests can be started",
        });
      }

      const updatedRequest = await ctx.db.request.update({
        where: { id: input.requestId },
        data: { status: "IN_PROGRESS" },
      });

      // Add system comment
      await ctx.db.requestComment.create({
        data: {
          requestId: input.requestId,
          userId,
          type: "SYSTEM",
          content: "Provider has started working on this request.",
        },
      });

      // Notify client
      await ctx.db.notification.create({
        data: {
          userId: request.clientId,
          type: "WORK_STARTED",
          title: "Work Started",
          message: `Work has started on your request "${request.title}"`,
          link: `/client/requests/${request.id}`,
        },
      });

      return { success: true, request: updatedRequest };
    }),

  // Deliver work
  deliverWork: providerProcedure
    .input(
      z.object({
        requestId: z.string(),
        deliverableMessage: z.string().min(5, "Deliverable message must be at least 5 characters"),
        files: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const request = await ctx.db.request.findUnique({
        where: { id: input.requestId },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.providerId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to this request",
        });
      }

      if (!["IN_PROGRESS", "REVISION_REQUESTED"].includes(request.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Request must be in progress or revision requested to deliver",
        });
      }

      // Update request status
      const updatedRequest = await ctx.db.request.update({
        where: { id: input.requestId },
        data: { status: "DELIVERED" },
      });

      // Add deliverable comment
      await ctx.db.requestComment.create({
        data: {
          requestId: input.requestId,
          userId,
          type: "DELIVERABLE",
          content: input.deliverableMessage,
          files: input.files || [],
        },
      });

      // Notify client
      await ctx.db.notification.create({
        data: {
          userId: request.clientId,
          type: "DELIVERABLE_READY",
          title: "Deliverable Ready",
          message: `Your request "${request.title}" has a new deliverable ready for review`,
          link: `/client/requests/${request.id}`,
        },
      });

      return { success: true, request: updatedRequest };
    }),
});
