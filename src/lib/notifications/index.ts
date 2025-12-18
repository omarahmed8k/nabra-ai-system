import { db } from "@/lib/db";
import {
  sendEmail,
  getNewMessageEmailTemplate,
  getStatusChangeEmailTemplate,
  getAssignmentEmailTemplate,
  getSubscriptionExpiringEmailTemplate,
  getSubscriptionExpiredEmailTemplate,
  getWelcomeEmailTemplate,
} from "./email";
import { sendNotificationToUser } from "./sse-utils";

// Store for SSE notification sender (will be set by SSE route when a user connects)
let sseNotificationSender: ((userId: string, notification: any) => void) | null = null;

export function setSseNotificationSender(sender: (userId: string, notification: any) => void) {
  sseNotificationSender = sender;
}

// Function to get the SSE sender - uses centralized sse-utils
function getSseSender(): (userId: string, notification: any) => void {
  // Use registered sender if available, otherwise fall back to sse-utils
  return sseNotificationSender || sendNotificationToUser;
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

  // Get user email for email notification
  if (shouldSendEmail && emailTemplate) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    }
  }

  // Send realtime notification via SSE
  const sender = getSseSender();
  try {
    sender(userId, {
      type,
      title,
      message,
      link: link || undefined,
      data: { notificationId: notification.id },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to send SSE notification:", error);
  }

  return notification;
}

export async function notifyAdminsNewPendingPayment(params: {
  clientNameOrEmail: string;
  amount: number;
  currency: string;
}) {
  const { clientNameOrEmail, amount, currency } = params;

  const admins = await db.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { id: true, email: true },
  });

  const title = "New Payment Verification Required";
  const message = `${clientNameOrEmail} submitted a payment proof: ${amount.toFixed(2)} ${currency}.`;
  const link = "/admin/payments";

  // Notify each admin (DB + SSE). Email optional.
  await Promise.all(
    admins.map(async (admin) =>
      createNotification({
        userId: admin.id,
        title,
        message,
        type: "general",
        link,
        sendEmail: false,
      })
    )
  );

  return { notifiedAdmins: admins.length };
}

export async function notifyNewMessage(params: {
  requestId: string;
  senderName: string;
  recipientId: string;
  messagePreview: string;
}) {
  const { requestId, senderName, recipientId, messagePreview } = params;

  // Batch both queries in parallel to avoid sequential DB calls
  const [request, user] = await Promise.all([
    db.request.findUnique({
      where: { id: requestId },
      select: { title: true, providerId: true },
    }),
    db.user.findUnique({
      where: { id: recipientId },
      select: { role: true },
    }),
  ]);

  if (!request) return;

  const emailTemplate = getNewMessageEmailTemplate(senderName, request.title, messagePreview);

  // Determine the correct link based on role and assignment status
  let link: string;
  if (user?.role === "CLIENT") {
    link = `/client/requests/${requestId}`;
  } else if (user?.role === "PROVIDER") {
    // If provider is not assigned to this request, send to available page
    const isAssigned = request.providerId === recipientId;
    link = isAssigned ? `/provider/requests/${requestId}` : `/provider/available/${requestId}`;
  } else {
    link = `/provider/requests/${requestId}`;
  }

  return createNotification({
    userId: recipientId,
    title: `New message from ${senderName}`,
    message: messagePreview,
    type: "message",
    link,
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

  // Batch both queries in parallel to avoid sequential DB calls
  const [request, user] = await Promise.all([
    db.request.findUnique({
      where: { id: requestId },
      select: { title: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
  ]);

  if (!request) return;

  const emailTemplate = getStatusChangeEmailTemplate(request.title, oldStatus, newStatus);
  const linkPrefix = user?.role === "CLIENT" ? "/client" : "/provider";

  return createNotification({
    userId,
    title: "Request Status Updated",
    message: `Your request "${request.title}" status changed from ${oldStatus.replace("_", " ")} to ${newStatus.replace("_", " ")}`,
    type: "status_change",
    link: `${linkPrefix}/requests/${requestId}`,
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

export async function notifySubscriptionExpiring(params: {
  userId: string;
  packageName: string;
  daysRemaining: number;
  remainingCredits: number;
}) {
  const { userId, packageName, daysRemaining, remainingCredits } = params;

  const emailTemplate = getSubscriptionExpiringEmailTemplate(
    packageName,
    daysRemaining,
    remainingCredits
  );

  return createNotification({
    userId,
    title: "⚠️ Subscription Expiring Soon",
    message: `Your ${packageName} subscription expires in ${daysRemaining} days. Renew now to continue service.`,
    type: "general",
    link: `/client/subscription`,
    emailTemplate,
  });
}

export async function notifySubscriptionExpired(params: { userId: string; packageName: string }) {
  const { userId, packageName } = params;

  const emailTemplate = getSubscriptionExpiredEmailTemplate(packageName);

  return createNotification({
    userId,
    title: "❌ Subscription Expired",
    message: `Your ${packageName} subscription has expired. Renew now to continue using our services.`,
    type: "general",
    link: `/client/subscription`,
    emailTemplate,
  });
}

export async function sendWelcomeEmail(params: {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const { userId, userName, userEmail, userRole } = params;

  const emailTemplate = getWelcomeEmailTemplate(userName, userRole);

  try {
    await sendEmail({
      to: userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    // Also create a notification in the database
    let notificationLink: string;
    if (userRole === "CLIENT") {
      notificationLink = "/client";
    } else if (userRole === "PROVIDER") {
      notificationLink = "/provider";
    } else {
      notificationLink = "/admin";
    }

    await db.notification.create({
      data: {
        userId,
        title: "Welcome to Nabra AI System! 🎉",
        message: `Hi ${userName}! Your account has been created successfully. Start exploring the platform now.`,
        type: "general",
        link: notificationLink,
        isRead: false,
      },
    });

    console.log(`✅ Welcome email sent to ${userEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${userEmail}:`, error);
    // Don't throw - welcome email failure shouldn't break registration
  }
}
