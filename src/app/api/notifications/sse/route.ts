import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { setSseNotificationSender } from "@/lib/notifications";

// Use global storage to persist across HMR reloads
const getClientsMap = () => {
  if (!(globalThis as any).__sseClients) {
    (globalThis as any).__sseClients = new Map<string, ReadableStreamDefaultController>();
  }
  return (globalThis as any).__sseClients as Map<string, ReadableStreamDefaultController>;
};

const clients = getClientsMap();

// Debug function to check connected clients
export function getConnectedClients() {
  return Array.from(clients.keys());
}

export const dynamic = "force-dynamic";

// Export function to send notifications
export function sendNotificationToUser(userId: string, notification: any) {
  const controller = clients.get(userId);
  console.log(`� SSE: Attempting to send notification to user ${userId}`);
  console.log(`📡 SSE: Controller exists: ${!!controller}`);
  console.log(`📡 SSE: Total connected clients: ${clients.size}`);
  console.log(`📡 SSE: Notification payload:`, JSON.stringify(notification));

  if (controller) {
    try {
      const data = `data: ${JSON.stringify(notification)}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
      console.log(`✅ SSE: Notification sent successfully to user ${userId}`);
    } catch (error) {
      console.error(`❌ SSE: Error sending notification to user ${userId}:`, error);
      clients.delete(userId);
    }
  } else {
    console.warn(`⚠️ SSE: No active connection for user ${userId}`);
    console.warn(`⚠️ SSE: Connected users:`, Array.from(clients.keys()));
  }
}

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

// Helper to broadcast to multiple users
export function broadcastNotification(userIds: string[], notification: any) {
  userIds.forEach((userId) => sendNotificationToUser(userId, notification));
}
