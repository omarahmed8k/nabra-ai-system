import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based access control
    if (path.startsWith("/admin") && token?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (path.startsWith("/provider") && token?.role !== "PROVIDER" && token?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (path.startsWith("/client") && token?.role !== "CLIENT" && token?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/client/:path*", "/provider/:path*", "/admin/:path*"],
};
