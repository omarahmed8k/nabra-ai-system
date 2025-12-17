import createMiddleware from "next-intl/middleware";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

function getPathWithoutLocale(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];
  const rest = routing.locales.includes(maybeLocale as (typeof routing.locales)[number])
    ? segments.slice(1)
    : segments;
  return rest.join("/");
}

function isProtected(pathname: string) {
  const first = getPathWithoutLocale(pathname).split("/")[0];
  return first === "client" || first === "provider" || first === "admin";
}

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const segments = pathname.split("/").filter(Boolean);
    const hasLocale = routing.locales.includes(segments[0] as (typeof routing.locales)[number]);

    if (!hasLocale) {
      const url = req.nextUrl.clone();
      url.pathname = `/${routing.defaultLocale}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }

    const intlResponse = handleI18nRouting(req);

    if (!isProtected(req.nextUrl.pathname)) {
      return intlResponse;
    }

    const token = req.nextauth.token;
    const basePath = getPathWithoutLocale(req.nextUrl.pathname);

    if (basePath.startsWith("admin") && token?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (
      basePath.startsWith("provider") &&
      token?.role !== "PROVIDER" &&
      token?.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (
      basePath.startsWith("client") &&
      token?.role !== "CLIENT" &&
      token?.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return intlResponse;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Only require auth for protected paths
        if (!isProtected(req.nextUrl.pathname)) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  // Apply to all non-static, non-API routes so default-locale routing works at "/".
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
