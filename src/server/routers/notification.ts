import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";

export const notificationRouter = router({
  // Get notifications for current user
  getAll: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const where: any = { userId };
      if (input?.unreadOnly) {
        where.isRead = false;
      }

      const notifications = await ctx.db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input?.limit || 20,
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        skip: input?.cursor ? 1 : 0,
      });

      return {
        notifications,
        nextCursor:
          notifications.length === (input?.limit || 20)
            ? notifications.at(-1)?.id ?? null
            : null,
      };
    }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const count = await ctx.db.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const notification = await ctx.db.notification.updateMany({
        where: {
          id: input.id,
          userId, // Ensure user owns this notification
        },
        data: { isRead: true },
      });

      return { success: notification.count > 0 };
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    await ctx.db.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  }),

  // Delete notification
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const result = await ctx.db.notification.deleteMany({
        where: {
          id: input.id,
          userId,
        },
      });

      return { success: result.count > 0 };
    }),

  // Delete all read notifications
  deleteAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const result = await ctx.db.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    return { success: true, deleted: result.count };
  }),
});
