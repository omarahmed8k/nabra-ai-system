import createMiddleware from "next-intl/middleware";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

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
    const firstSegment = pathname.split("/").find(Boolean);

    // Bypass API, Next internals, and static assets to avoid locale rewrites
    const isApi = pathname.startsWith("/api");
    const isNext = pathname.startsWith("/_next");
    // Special-case favicon: rewrite to existing SVG asset
    if (pathname === "/favicon.ico") {
      return NextResponse.rewrite(new URL("/images/favicon.svg", req.url));
    }

    const isKnownFile =
      pathname === "/robots.txt" || pathname === "/sitemap.xml" || pathname === "/manifest.json";
    const hasFileExtension = pathname.includes(".");
    if (isApi || isNext || isKnownFile || hasFileExtension) {
      return NextResponse.next();
    }
    const hasLocale = routing.locales.includes(firstSegment as (typeof routing.locales)[number]);

    if (!hasLocale) {
      const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value;
      const preferredLocale = routing.locales.includes(
        cookieLocale as (typeof routing.locales)[number]
      )
        ? (cookieLocale as (typeof routing.locales)[number])
        : routing.defaultLocale;

      const url = req.nextUrl.clone();
      url.pathname = `/${preferredLocale}${pathname === "/" ? "" : pathname}`;
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - files with extensions (e.g., .png, .jpg, .css, .js)
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
