import { z } from "zod";
import { router, protectedProcedure, clientProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { deductCredits, checkCredits } from "@/lib/credit-logic";
import { handleRevisionRequest, getRevisionInfo } from "@/lib/revision-logic";
import { validateAttributeResponses } from "@/lib/attribute-validation";
import type { ServiceAttribute, AttributeResponse } from "@/types/service-attributes";

export const requestRouter = router({
  // Create a new request (client only)
  create: clientProcedure
    .input(
      z.object({
        title: z.string().min(5, "Title must be at least 5 characters"),
        description: z.string().min(20, "Description must be at least 20 characters"),
        serviceTypeId: z.string(),
        priority: z.number().min(1).max(3).default(2),
        formData: z.record(z.any()).optional(),
        attributeResponses: z.any().optional(), // Client's answers to service Q&A: [{question: string, answer: string}]
        attachments: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get service type to validate attributes and credit cost
      const serviceType = await ctx.db.serviceType.findUnique({
        where: { id: input.serviceTypeId },
      }) as any; // Cast to any to avoid type issues with Json fields

      if (!serviceType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service type not found",
        });
      }

      // Validate attribute responses if service has required attributes
      if (serviceType.attributes && input.attributeResponses) {
        const validation = validateAttributeResponses(
          serviceType.attributes as ServiceAttribute[],
          input.attributeResponses as AttributeResponse[]
        );
        
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid attribute responses: ${validation.errors.join(", ")}`,
          });
        }
      }

      // Get credit cost from service type (default to 1 if not set)
      const baseCreditCost = serviceType.creditCost || 1;
      
      // Apply priority multiplier: Low=1x, Medium=1.5x, High=2x
      const priorityMultipliers: Record<number, number> = { 1: 1, 2: 1.5, 3: 2 };
      const priorityMultiplier = priorityMultipliers[input.priority] || 1.5;
      const totalCreditCost = Math.ceil(baseCreditCost * priorityMultiplier);

      // Check credits before creating
      const creditCheck = await checkCredits(userId, totalCreditCost);
      if (!creditCheck.allowed) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: creditCheck.message,
        });
      }

      // Deduct credits based on service type and priority
      const deductResult = await deductCredits(userId, totalCreditCost, `New request: ${input.title} (Priority ${input.priority})`);
      if (!deductResult.success) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: deductResult.message,
        });
      }

      // Create the request
      const request = await ctx.db.request.create({
        data: {
          title: input.title,
          description: input.description,
          clientId: userId,
          serviceTypeId: input.serviceTypeId,
          priority: input.priority,
          formData: input.formData || {},
          attributeResponses: input.attributeResponses || null,
          attachments: input.attachments || [],
          status: "PENDING",
        } as any,
        include: {
          serviceType: true,
        },
      });

      // Create system comment
      await ctx.db.requestComment.create({
        data: {
          requestId: request.id,
          userId,
          content: "Request created. Waiting for a provider to accept.",
          type: "SYSTEM",
        },
      });

      return {
        success: true,
        request,
        creditsRemaining: deductResult.newBalance,
        message: "Request created successfully. 1 credit has been deducted.",
      };
    }),

  // Get all requests for current user (role-based)
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED", "COMPLETED", "CANCELLED"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const role = ctx.session.user.role;

      let where: any = {};

      if (role === "CLIENT") {
        where.clientId = userId;
      } else if (role === "PROVIDER") {
        // Providers see their accepted requests + pending requests matching their skills
        await ctx.db.providerProfile.findUnique({
          where: { userId },
        });

        where = {
          OR: [
            { providerId: userId },
            {
              AND: [
                { status: "PENDING" },
                { providerId: null },
              ],
            },
          ],
        };
      }
      // SUPER_ADMIN sees all requests

      if (input?.status) {
        where.status = input.status;
      }

      const requests = await ctx.db.request.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, email: true, image: true },
          },
          provider: {
            select: { id: true, name: true, email: true, image: true },
          },
          serviceType: true,
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit || 20,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        skip: input?.cursor ? 1 : 0,
      });

      return {
        requests,
        nextCursor: requests.length === (input?.limit || 20) ? requests.at(-1)?.id ?? null : null,
      };
    }),

  // Get single request by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const role = ctx.session.user.role;

      const request = await ctx.db.request.findUnique({
        where: { id: input.id },
        include: {
          client: {
            select: { id: true, name: true, email: true, image: true },
          },
          provider: {
            select: { id: true, name: true, email: true, image: true },
          },
          serviceType: true,
          comments: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true, role: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          rating: true,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      // Access control
      if (role === "CLIENT" && request.clientId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this request",
        });
      }

      if (role === "PROVIDER" && request.providerId !== userId && request.status !== "PENDING") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this request",
        });
      }

      // Get revision info if client
      let revisionInfo = null;
      if (role === "CLIENT" || role === "SUPER_ADMIN") {
        revisionInfo = await getRevisionInfo(input.id, request.clientId);
      }

      return {
        ...request,
        revisionInfo,
      };
    }),

  // Provider accepts a request
  accept: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        estimatedDays: z.number().min(1).max(90).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const role = ctx.session.user.role;

      if (role !== "PROVIDER" && role !== "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only providers can accept requests",
        });
      }

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
          code: "CONFLICT",
          message: "This request has already been accepted",
        });
      }

      const estimatedDelivery = input.estimatedDays
        ? new Date(Date.now() + input.estimatedDays * 24 * 60 * 60 * 1000)
        : null;

      const updatedRequest = await ctx.db.request.update({
        where: { id: input.requestId },
        data: {
          providerId: userId,
          status: "IN_PROGRESS",
          estimatedDelivery,
        },
      });

      // Create system comment
      const deliveryMessage = estimatedDelivery
        ? `Estimated delivery: ${estimatedDelivery.toLocaleDateString()}`
        : "";
      await ctx.db.requestComment.create({
        data: {
          requestId: input.requestId,
          userId,
          content: `Request accepted. ${deliveryMessage}`.trim(),
          type: "SYSTEM",
        },
      });

      // Notify client
      await ctx.db.notification.create({
        data: {
          userId: request.clientId,
          title: "Request Accepted",
          message: `Your request "${request.title}" has been accepted by a provider.`,
          type: "request",
          link: `/client/requests/${request.id}`,
        },
      });

      return {
        success: true,
        request: updatedRequest,
      };
    }),

  // Update request status (provider)
  updateStatus: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        status: z.enum(["IN_PROGRESS", "DELIVERED"]),
        message: z.string().optional(),
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

      if (request.providerId !== userId && ctx.session.user.role !== "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not assigned to this request",
        });
      }

      const updatedRequest = await ctx.db.request.update({
        where: { id: input.requestId },
        data: { status: input.status },
      });

      // Create comment
      const commentType = input.status === "DELIVERED" ? "DELIVERABLE" : "SYSTEM";
      await ctx.db.requestComment.create({
        data: {
          requestId: input.requestId,
          userId,
          content: input.message || `Status updated to ${input.status}`,
          type: commentType,
          files: input.files || [],
        },
      });

      // Notify client
      await ctx.db.notification.create({
        data: {
          userId: request.clientId,
          title: input.status === "DELIVERED" ? "Deliverable Ready" : "Status Update",
          message: input.status === "DELIVERED"
            ? `Your request "${request.title}" has a new deliverable ready for review.`
            : `Your request "${request.title}" status has been updated.`,
          type: "request",
          link: `/client/requests/${request.id}`,
        },
      });

      return {
        success: true,
        request: updatedRequest,
      };
    }),

  // Request revision (client)
  requestRevision: clientProcedure
    .input(
      z.object({
        requestId: z.string(),
        feedback: z.string().min(10, "Please provide detailed feedback"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Use the smart revision logic
      const result = await handleRevisionRequest(input.requestId, userId);

      if (!result.allowed) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: result.message,
        });
      }

      // Add the client's feedback as a comment
      await ctx.db.requestComment.create({
        data: {
          requestId: input.requestId,
          userId,
          content: input.feedback,
          type: "MESSAGE",
        },
      });

      return result;
    }),

  // Approve request (client)
  approve: clientProcedure
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

      if (request.clientId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't own this request",
        });
      }

      if (request.status !== "DELIVERED") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Request must be in DELIVERED status to approve",
        });
      }

      const updatedRequest = await ctx.db.request.update({
        where: { id: input.requestId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // System comment
      await ctx.db.requestComment.create({
        data: {
          requestId: input.requestId,
          userId,
          content: "Request approved and completed.",
          type: "SYSTEM",
        },
      });

      // Notify provider
      if (request.providerId) {
        await ctx.db.notification.create({
          data: {
            userId: request.providerId,
            title: "Request Completed",
            message: `Client has approved "${request.title}". Great job!`,
            type: "request",
            link: `/provider/requests/${request.id}`,
          },
        });
      }

      return {
        success: true,
        request: updatedRequest,
      };
    }),

  // Add comment to request
  addComment: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        content: z.string().min(1),
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

      // Check access
      const isClient = request.clientId === userId;
      const isProvider = request.providerId === userId;
      const isAdmin = ctx.session.user.role === "SUPER_ADMIN";

      if (!isClient && !isProvider && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this request",
        });
      }

      const comment = await ctx.db.requestComment.create({
        data: {
          requestId: input.requestId,
          userId,
          content: input.content,
          type: "MESSAGE",
          files: input.files || [],
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true, role: true },
          },
        },
      });

      // Notify the other party
      const recipientId = isClient ? request.providerId : request.clientId;
      if (recipientId) {
        await ctx.db.notification.create({
          data: {
            userId: recipientId,
            title: "New Message",
            message: `New message on "${request.title}"`,
            type: "request",
            link: isClient ? `/provider/requests/${request.id}` : `/client/requests/${request.id}`,
          },
        });
      }

      return comment;
    }),

  // Submit rating (client)
  rate: clientProcedure
    .input(
      z.object({
        requestId: z.string(),
        rating: z.number().min(1).max(5),
        reviewText: z.string().optional(),
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

      if (request.clientId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't own this request",
        });
      }

      if (request.status !== "COMPLETED") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Request must be completed before rating",
        });
      }

      if (!request.providerId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No provider assigned to this request",
        });
      }

      // Check if already rated
      const existingRating = await ctx.db.rating.findUnique({
        where: { requestId: input.requestId },
      });

      if (existingRating) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This request has already been rated",
        });
      }

      const rating = await ctx.db.rating.create({
        data: {
          requestId: input.requestId,
          clientId: userId,
          providerId: request.providerId,
          rating: input.rating,
          reviewText: input.reviewText,
        },
      });

      // Notify provider
      await ctx.db.notification.create({
        data: {
          userId: request.providerId,
          title: "New Rating",
          message: `You received a ${input.rating}-star rating for "${request.title}"`,
          type: "request",
          link: `/provider/requests/${request.id}`,
        },
      });

      return {
        success: true,
        rating,
      };
    }),

  // Get service types
  getServiceTypes: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.serviceType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }),
});
