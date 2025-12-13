// SSE notification utilities
// Separate file to avoid Next.js route export restrictions

// Use global storage to persist across HMR reloads
const getClientsMap = () => {
  if (!(globalThis as any).__sseClients) {
    (globalThis as any).__sseClients = new Map<string, ReadableStreamDefaultController>();
  }
  return (globalThis as any).__sseClients as Map<string, ReadableStreamDefaultController>;
};

const clients = getClientsMap();

// Helper function to check connected clients
export function getConnectedClients() {
  return Array.from(clients.keys());
}

// Function to send notifications to users
export function sendNotificationToUser(userId: string, notification: any) {
  const controller = clients.get(userId);
  console.log(`📡 SSE: Attempting to send notification to user ${userId}`);
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

// Get the clients map for route handler
export function getSseClients() {
  return clients;
}

// Helper to broadcast to multiple users
export function broadcastNotification(userIds: string[], notification: any) {
  userIds.forEach((userId) => sendNotificationToUser(userId, notification));
}
