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

  if (controller) {
    try {
      const data = `data: ${JSON.stringify(notification)}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
    } catch (error) {
      console.error(`SSE error for user ${userId}:`, error);
      clients.delete(userId);
    }
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
