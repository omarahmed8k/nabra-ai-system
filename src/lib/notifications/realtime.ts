// Import this in your API routes to send real-time notifications

type NotificationType = "message" | "status_change" | "assignment" | "general";

interface RealtimeNotification {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
}

// This will be set by the SSE route
let notificationSender: ((userId: string, notification: RealtimeNotification) => void) | null =
  null;

export function setNotificationSender(
  sender: (userId: string, notification: RealtimeNotification) => void
) {
  notificationSender = sender;
}

export function sendRealtimeNotification(
  userId: string,
  notification: Omit<RealtimeNotification, "timestamp">
) {
  const fullNotification: RealtimeNotification = {
    ...notification,
    timestamp: new Date(),
  };

  // Try to send via SSE if available
  if (notificationSender) {
    try {
      notificationSender(userId, fullNotification);
    } catch (error) {
      console.error("Failed to send realtime notification:", error);
    }
  }
}

export function broadcastToUsers(
  userIds: string[],
  notification: Omit<RealtimeNotification, "timestamp">
) {
  userIds.forEach((userId) => sendRealtimeNotification(userId, notification));
}
