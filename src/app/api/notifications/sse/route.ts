import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { setSseNotificationSender } from "@/lib/notifications";
import { getSseClients, sendNotificationToUser } from "@/lib/notifications/sse-utils";

export const dynamic = "force-dynamic";

// Set the SSE sender in the notification module immediately
console.log("🔧 SSE Route: Module loaded, registering notification sender...");
setSseNotificationSender(sendNotificationToUser);
console.log("✅ SSE Route: Notification sender registered successfully");

// Also ensure this gets called on any import
if (typeof globalThis !== "undefined") {
  if (!(globalThis as any).__sseInitialized) {
    (globalThis as any).__sseInitialized = true;
    console.log("✅ SSE: Global initialization complete");
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.log("❌ SSE: Unauthorized access attempt");
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const clients = getSseClients();
  console.log(`🟢 SSE: New connection from user ${userId}`);

  const stream = new ReadableStream({
    start(controller) {
      // Store the connection
      clients.set(userId, controller);
      console.log(`📡 SSE: Client connected, total clients: ${clients.size}`);

      // Send initial connection message
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
        } catch {
          // Failed to enqueue, connection likely closed
          console.log(`💔 SSE: Heartbeat failed for user ${userId}`);
          clearInterval(heartbeat);
          clients.delete(userId);
        }
      }, 30000); // Every 30 seconds

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        console.log(`🔴 SSE: Connection closed for user ${userId}`);
        clearInterval(heartbeat);
        clients.delete(userId);
        try {
          controller.close();
        } catch {
          // Connection already closed, ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
