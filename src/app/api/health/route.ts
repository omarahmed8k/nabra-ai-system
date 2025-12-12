import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;

    // Get system info
    const userCount = await db.user.count();
    const requestCount = await db.request.count();

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      stats: {
        users: userCount,
        requests: requestCount,
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
