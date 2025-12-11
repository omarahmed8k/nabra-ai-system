import { db } from "@/lib/db";
import {
  sendEmail,
  getNewMessageEmailTemplate,
  getStatusChangeEmailTemplate,
  getAssignmentEmailTemplate,
} from "./email";

// Store for SSE notification sender (will be set by SSE route)
let sseNotificationSender: ((userId: string, notification: any) => void) | null = null;
let sseInitialized = false;

export function setSseNotificationSender(sender: (userId: string, notification: any) => void) {
  sseNotificationSender = sender;
  sseInitialized = true;
  console.log("✅ SSE notification sender registered in notification module");
}

// Function to get the SSE sender, with lazy initialization attempt
async function getSseSender() {
  if (sseNotificationSender) {
    return sseNotificationSender;
  }

  // Try to trigger SSE route initialization by importing it
  if (!sseInitialized) {
    try {
      console.log("🔄 Attempting to initialize SSE route...");
      // Dynamic import to trigger the route module loading
      await import("@/app/api/notifications/sse/route");
      console.log("✅ SSE route module loaded");
    } catch (error) {
      console.error("❌ Failed to load SSE route:", error);
    }
  }

  return sseNotificationSender;
}

interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type?: "message" | "status_change" | "assignment" | "general";
  link?: string;
  sendEmail?: boolean;
  emailTemplate?: {
    subject: string;
    html: string;
  };
}

export async function createNotification(data: NotificationData) {
  const {
    userId,
    title,
    message,
    type = "general",
    link,
    sendEmail: shouldSendEmail = true,
    emailTemplate,
  } = data;

  console.log("📝 Creating notification:", { userId, title, type });

  // Create database notification
  const notification = await db.notification.create({
    data: {
      userId,
      title,
      message,
      type: "general",
      link,
      isRead: false,
    },
  });

  console.log("✅ Database notification created:", notification.id);

  // Get user email for email notification
  if (shouldSendEmail && emailTemplate) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email) {
      console.log("📧 Sending email to:", user.email);
      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    }
  }

  // Send realtime notification via SSE if available
  const sender = await getSseSender();
  if (sender) {
    console.log("📡 Sending SSE notification to user:", userId);
    try {
      sender(userId, {
        type,
        title,
        message,
        link: link || undefined,
        data: { notificationId: notification.id },
        timestamp: new Date(),
      });
      console.log("✅ SSE notification sent");
    } catch (error) {
      console.error("❌ Failed to send SSE notification:", error);
    }
  } else {
    console.warn("⚠️ SSE notification sender not available - user may not be connected");
  }

  return notification;
}

export async function notifyNewMessage(params: {
  requestId: string;
  senderName: string;
  recipientId: string;
  messagePreview: string;
}) {
  const { requestId, senderName, recipientId, messagePreview } = params;

  const request = await db.request.findUnique({
    where: { id: requestId },
    select: { title: true },
  });

  if (!request) return;

  const emailTemplate = getNewMessageEmailTemplate(senderName, request.title, messagePreview);
  const userRole = await db.user.findUnique({
    where: { id: recipientId },
    select: { role: true },
  });

  const linkPrefix = userRole?.role === "CLIENT" ? "/client" : "/provider";

  return createNotification({
    userId: recipientId,
    title: `New message from ${senderName}`,
    message: messagePreview,
    type: "message",
    link: `${linkPrefix}/requests/${requestId}`,
    emailTemplate,
  });
}

export async function notifyStatusChange(params: {
  requestId: string;
  userId: string;
  oldStatus: string;
  newStatus: string;
}) {
  const { requestId, userId, oldStatus, newStatus } = params;

  const request = await db.request.findUnique({
    where: { id: requestId },
    select: { title: true },
  });

  if (!request) return;

  const emailTemplate = getStatusChangeEmailTemplate(request.title, oldStatus, newStatus);

  return createNotification({
    userId,
    title: "Request Status Updated",
    message: `Your request "${request.title}" status changed from ${oldStatus.replace("_", " ")} to ${newStatus.replace("_", " ")}`,
    type: "status_change",
    link: `/client/requests/${requestId}`,
    emailTemplate,
  });
}

export async function notifyProviderAssignment(params: {
  requestId: string;
  providerId: string;
  providerName: string;
}) {
  const { requestId, providerId, providerName } = params;

  const request = await db.request.findUnique({
    where: { id: requestId },
    select: { title: true },
  });

  if (!request) return;

  const emailTemplate = getAssignmentEmailTemplate(request.title, providerName);

  return createNotification({
    userId: providerId,
    title: "New Request Assigned",
    message: `You have been assigned to: ${request.title}`,
    type: "assignment",
    link: `/provider/my-requests`,
    emailTemplate,
  });
}
