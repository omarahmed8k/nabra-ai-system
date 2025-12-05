import { z } from "zod";
import { router, adminProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

export const adminRouter = router({
  // Get dashboard stats
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      clients,
      providers,
      totalRequests,
      activeRequests,
      pendingRequests,
      completedRequests,
      activeSubscriptions,
      serviceTypes,
      avgRating,
      totalRevenue,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({ where: { role: "CLIENT" } }),
      ctx.db.user.count({ where: { role: "PROVIDER" } }),
      ctx.db.request.count(),
      ctx.db.request.count({ where: { status: { in: ["PENDING", "IN_PROGRESS", "REVISION_REQUESTED"] } } }),
      ctx.db.request.count({ where: { status: "PENDING" } }),
      ctx.db.request.count({ where: { status: "COMPLETED" } }),
      ctx.db.clientSubscription.count({
        where: { isActive: true, endDate: { gte: new Date() } },
      }),
      ctx.db.serviceType.count({ where: { isActive: true } }),
      ctx.db.rating.aggregate({ _avg: { rating: true } }),
      ctx.db.clientSubscription.findMany({
        where: { isActive: true },
        include: { package: true },
      }),
    ]);

    const revenue = totalRevenue.reduce((sum: number, sub: { package: { price: number } }) => sum + sub.package.price, 0);

    return {
      totalUsers,
      clients,
      providers,
      totalRequests,
      activeRequests,
      pendingRequests,
      completedRequests,
      activeSubscriptions,
      serviceTypes,
      averageRating: avgRating._avg.rating,
      totalRevenue: revenue,
    };
  }),

  // Get analytics data for charts
  getAnalytics: adminProcedure.query(async ({ ctx }) => {
    // Get requests by status for pie chart
    const requestsByStatus = await ctx.db.request.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Get subscriptions by package for pie chart
    const subscriptionsByPackage = await ctx.db.clientSubscription.findMany({
      where: { isActive: true },
      include: { package: true },
    });

    const packageCounts = subscriptionsByPackage.reduce((acc: Record<string, number>, sub: { package: { name: string } }) => {
      const name = sub.package.name;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    // Get requests by service type
    const requestsByService = await ctx.db.request.groupBy({
      by: ['serviceTypeId'],
      _count: { id: true },
    });

    const serviceTypes = await ctx.db.serviceType.findMany();
    const serviceMap = serviceTypes.reduce((acc: Record<string, string>, s: { id: string; name: string }) => {
      acc[s.id] = s.name;
      return acc;
    }, {});

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await ctx.db.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Get recent requests (last 30 days)
    const recentRequests = await ctx.db.request.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const subscriptions = await ctx.db.clientSubscription.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      include: { package: true },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyRevenue: { month: string; revenue: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = months[date.getMonth()];
      const monthSubs = subscriptions.filter((s: { createdAt: Date }) => {
        const subDate = new Date(s.createdAt);
        return subDate.getMonth() === date.getMonth() && subDate.getFullYear() === date.getFullYear();
      });
      const revenue = monthSubs.reduce((sum: number, s: { package: { price: number } }) => sum + s.package.price, 0);
      monthlyRevenue.push({ month: monthName, revenue });
    }

    // Get top providers by completed requests
    const topProviders = await ctx.db.request.groupBy({
      by: ['providerId'],
      where: { 
        status: 'COMPLETED',
        providerId: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const providerIds = topProviders.map((p: { providerId: string | null }) => p.providerId).filter(Boolean) as string[];
    const providers = await ctx.db.user.findMany({
      where: { id: { in: providerIds } },
      select: { id: true, name: true, email: true },
    });

    const topProvidersWithInfo = topProviders.map((p: { providerId: string | null; _count: { id: number } }) => {
      const provider = providers.find((u: { id: string }) => u.id === p.providerId);
      return {
        name: provider?.name || provider?.email || 'Unknown',
        completedRequests: p._count.id,
      };
    });

    return {
      requestsByStatus: requestsByStatus.map((r: { status: string; _count: { id: number } }) => ({
        status: r.status,
        count: r._count.id,
      })),
      subscriptionsByPackage: Object.entries(packageCounts).map(([name, count]) => ({
        name,
        count,
      })),
      requestsByService: requestsByService.map((r: { serviceTypeId: string; _count: { id: number } }) => ({
        service: serviceMap[r.serviceTypeId] || 'Unknown',
        count: r._count.id,
      })),
      recentUsers,
      recentRequests,
      monthlyRevenue,
      topProviders: topProvidersWithInfo,
    };
  }),

  // Get all subscriptions with user info
  getAllSubscriptions: adminProcedure
    .input(
      z.object({
        status: z.enum(['active', 'expired', 'cancelled', 'all']).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      
      if (input?.status === 'active') {
        where.isActive = true;
        where.endDate = { gte: new Date() };
      } else if (input?.status === 'expired') {
        where.endDate = { lt: new Date() };
      } else if (input?.status === 'cancelled') {
        where.cancelledAt = { not: null };
      }

      const [subscriptions, total] = await Promise.all([
        ctx.db.clientSubscription.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true, createdAt: true } },
            package: true,
          },
          take: input?.limit || 50,
          skip: input?.offset || 0,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.clientSubscription.count({ where }),
      ]);

      return {
        subscriptions,
        total,
        hasMore: (input?.offset || 0) + subscriptions.length < total,
      };
    }),

  // Get dashboard stats (alias for backwards compatibility)
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalClients,
      totalProviders,
      totalRequests,
      pendingRequests,
      completedRequests,
      activeSubscriptions,
      totalRevenue,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({ where: { role: "CLIENT" } }),
      ctx.db.user.count({ where: { role: "PROVIDER" } }),
      ctx.db.request.count(),
      ctx.db.request.count({ where: { status: "PENDING" } }),
      ctx.db.request.count({ where: { status: "COMPLETED" } }),
      ctx.db.clientSubscription.count({
        where: { isActive: true, endDate: { gte: new Date() } },
      }),
      ctx.db.clientSubscription.findMany({
        where: { isActive: true },
        include: { package: true },
      }),
    ]);

    const revenue = totalRevenue.reduce((sum: number, sub: { package: { price: number } }) => sum + sub.package.price, 0);

    // Get recent requests
    const recentRequests = await ctx.db.request.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true, email: true } },
        provider: { select: { name: true, email: true } },
        serviceType: true,
      },
    });

    return {
      totalUsers,
      totalClients,
      totalProviders,
      totalRequests,
      pendingRequests,
      completedRequests,
      activeSubscriptions,
      totalRevenue: revenue,
      recentRequests,
    };
  }),

  // Get all users
  getUsers: adminProcedure
    .input(
      z.object({
        role: z.enum(["SUPER_ADMIN", "PROVIDER", "CLIENT"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().default(0),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input?.role) {
        where.role = input.role;
      }

      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          include: {
            providerProfile: {
              include: {
                supportedServices: {
                  select: { id: true, name: true },
                },
              },
            },
            _count: {
              select: {
                clientRequests: true,
                providerRequests: true,
                clientSubscriptions: true,
              },
            },
          },
          take: input?.limit || 50,
          skip: input?.offset || 0,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.user.count({ where }),
      ]);

      return {
        users,
        total,
        hasMore: (input?.offset || 0) + users.length < total,
      };
    }),

  // Get all requests
  getAllRequests: adminProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED", "COMPLETED", "CANCELLED"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input?.status) {
        where.status = input.status;
      }

      const [requests, total] = await Promise.all([
        ctx.db.request.findMany({
          where,
          include: {
            client: { select: { id: true, name: true, email: true } },
            provider: { select: { id: true, name: true, email: true } },
            serviceType: true,
          },
          take: input?.limit || 50,
          skip: input?.offset || 0,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.request.count({ where }),
      ]);

      return {
        requests,
        total,
        hasMore: (input?.offset || 0) + requests.length < total,
      };
    }),

  // Create service type
  createServiceType: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        icon: z.string().optional(),
        formFields: z.any().optional(),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.serviceType.findUnique({
        where: { name: input.name },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A service type with this name already exists",
        });
      }

      const serviceType = await ctx.db.serviceType.create({
        data: {
          name: input.name,
          description: input.description,
          icon: input.icon,
          formFields: input.formFields,
          sortOrder: input.sortOrder,
        },
      });

      return {
        success: true,
        serviceType,
      };
    }),

  // Update service type
  updateServiceType: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        formFields: z.any().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const serviceType = await ctx.db.serviceType.update({
        where: { id },
        data,
      });

      return {
        success: true,
        serviceType,
      };
    }),

  // Delete service type
  deleteServiceType: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if service type has requests
      const requestCount = await ctx.db.request.count({
        where: { serviceTypeId: input.id },
      });

      if (requestCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete service type with ${requestCount} existing requests. Deactivate it instead.`,
        });
      }

      await ctx.db.serviceType.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Create package
  createPackage: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        price: z.number().min(0),
        credits: z.number().min(1),
        maxFreeRevisions: z.number().min(0),
        durationDays: z.number().min(1).default(30),
        features: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pkg = await ctx.db.package.create({
        data: input,
      });

      return { success: true, package: pkg };
    }),

  // Update package
  updatePackage: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).optional(),
        price: z.number().min(0).optional(),
        credits: z.number().min(1).optional(),
        maxFreeRevisions: z.number().min(0).optional(),
        features: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const pkg = await ctx.db.package.update({
        where: { id },
        data,
      });

      return { success: true, package: pkg };
    }),

  // Delete package
  deletePackage: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if package has active subscriptions
      const subCount = await ctx.db.clientSubscription.count({
        where: { packageId: input.id, isActive: true },
      });

      if (subCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete package with ${subCount} active subscriptions. Deactivate it instead.`,
        });
      }

      await ctx.db.package.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Get all service types (including inactive)
  getServiceTypes: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.serviceType.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { requests: true } },
      },
    });
  }),

  // Update user role
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["SUPER_ADMIN", "PROVIDER", "CLIENT"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent admin from changing their own role
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot change your own role",
        });
      }

      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      // Create provider profile if changing to provider
      if (input.role === "PROVIDER") {
        await ctx.db.providerProfile.upsert({
          where: { userId: input.userId },
          update: {},
          create: {
            userId: input.userId,
            skillsTags: [],
          },
        });
      }

      return {
        success: true,
        user,
      };
    }),

  // Get all providers for assignment
  getProviders: adminProcedure
    .input(
      z.object({
        serviceTypeId: z.string().optional(), // Filter providers by supported service
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const providers = await ctx.db.user.findMany({
        where: { 
          role: "PROVIDER",
          ...(input?.serviceTypeId && {
            providerProfile: {
              supportedServices: {
                some: { id: input.serviceTypeId },
              },
            },
          }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          providerProfile: {
            select: {
              bio: true,
              skillsTags: true,
              supportedServices: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              providerRequests: {
                where: {
                  status: { in: ["PENDING", "IN_PROGRESS"] },
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      });

      type ProviderWithProfile = typeof providers[number];

      return providers.map((p: ProviderWithProfile) => ({
        id: p.id,
        name: p.name || p.email,
        email: p.email,
        bio: p.providerProfile?.bio || null,
        skills: p.providerProfile?.skillsTags || [],
        supportedServices: p.providerProfile?.supportedServices || [],
        activeRequests: p._count.providerRequests,
      }));
    }),

  // Assign request to provider
  assignRequest: adminProcedure
    .input(
      z.object({
        requestId: z.string(),
        providerId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the request exists
      const request = await ctx.db.request.findUnique({
        where: { id: input.requestId },
        include: { provider: true },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      // Verify the provider exists and is a provider
      const provider = await ctx.db.user.findUnique({
        where: { id: input.providerId },
      });

      if (provider?.role !== "PROVIDER") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Provider not found",
        });
      }

      // Update the request with the provider
      const updatedRequest = await ctx.db.request.update({
        where: { id: input.requestId },
        data: {
          providerId: input.providerId,
          status: request.status === "PENDING" ? "IN_PROGRESS" : request.status,
        },
        include: {
          client: { select: { id: true, name: true, email: true } },
          provider: { select: { id: true, name: true, email: true } },
          serviceType: true,
        },
      });

      return {
        success: true,
        request: updatedRequest,
        message: `Request assigned to ${provider.name || provider.email}`,
      };
    }),

  // Unassign request from provider
  unassignRequest: adminProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.request.findUnique({
        where: { id: input.requestId },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (!request.providerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Request is not assigned to any provider",
        });
      }

      const updatedRequest = await ctx.db.request.update({
        where: { id: input.requestId },
        data: {
          providerId: null,
          status: "PENDING",
        },
        include: {
          client: { select: { id: true, name: true, email: true } },
          provider: { select: { id: true, name: true, email: true } },
          serviceType: true,
        },
      });

      return {
        success: true,
        request: updatedRequest,
        message: "Request unassigned successfully",
      };
    }),

  // Create new user
  createUser: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["CLIENT", "PROVIDER", "SUPER_ADMIN"]),
        supportedServiceIds: z.array(z.string()).optional(), // For providers only
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: input.role,
        },
      });

      // Create provider profile if role is PROVIDER
      if (input.role === "PROVIDER") {
        await ctx.db.providerProfile.create({
          data: {
            userId: user.id,
            skillsTags: [],
            supportedServices: input.supportedServiceIds?.length
              ? { connect: input.supportedServiceIds.map((id) => ({ id })) }
              : undefined,
          },
        });
      }

      return {
        success: true,
        user,
      };
    }),

  // Update provider supported services
  updateProviderServices: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        serviceIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: { providerProfile: true },
      });

      if (!user || user.role !== "PROVIDER") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Provider not found",
        });
      }

      // Upsert provider profile with new services
      await ctx.db.providerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          skillsTags: [],
          supportedServices: {
            connect: input.serviceIds.map((id) => ({ id })),
          },
        },
        update: {
          supportedServices: {
            set: input.serviceIds.map((id) => ({ id })),
          },
        },
      });

      return { success: true };
    }),

  // Get provider with their supported services
  getProviderDetails: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          providerProfile: {
            include: {
              supportedServices: true,
            },
          },
        },
      });

      if (user?.role !== "PROVIDER") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Provider not found",
        });
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        supportedServices: user.providerProfile?.supportedServices || [],
      };
    }),
});
