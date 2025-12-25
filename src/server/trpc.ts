import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import superjson from "superjson";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocaleFromCookie } from "@/lib/notifications/i18n-helper";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { NextApiRequest, NextApiResponse } from "next";

type NextApiCreateContextOpts = {
  req: NextApiRequest;
  res: NextApiResponse;
};

export const createTRPCContext = async (
  opts?: FetchCreateContextFnOptions | NextApiCreateContextOpts
) => {
  const session =
    opts && "res" in opts
      ? await getServerSession(opts.req, opts.res, authOptions)
      : await getServerSession(authOptions);

  // Extract locale from cookies
  let locale = "en";
  if (opts) {
    const req = "res" in opts ? opts.req : opts.req;
    if (req) {
      let cookieHeader: string | undefined;
      if ("headers" in req && req.headers instanceof Headers) {
        cookieHeader = req.headers.get("cookie") ?? undefined;
      } else if ("headers" in req && typeof req.headers === "object") {
        cookieHeader = (req.headers as Record<string, any>).cookie;
      }
      if (cookieHeader) {
        locale = getLocaleFromCookie(cookieHeader);
      }
    }
  }

  return {
    db,
    session,
    req: opts?.req,
    locale,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to enforce authentication
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

// Middleware to enforce admin role
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.session.user.role !== "SUPER_ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an admin to access this resource",
    });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdmin);

// Middleware to enforce provider role
const enforceUserIsProvider = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.session.user.role !== "PROVIDER" && ctx.session.user.role !== "SUPER_ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be a provider to access this resource",
    });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const providerProcedure = t.procedure.use(enforceUserIsProvider);

// Middleware to enforce client role
const enforceUserIsClient = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.session.user.role !== "CLIENT" && ctx.session.user.role !== "SUPER_ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be a client to access this resource",
    });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const clientProcedure = t.procedure.use(enforceUserIsClient);
