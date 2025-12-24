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
import {
  isWhatsAppEnabled,
  formatE164,
  getTemplateConfigForType,
  sendWhatsAppTemplate,
} from "./whatsapp";

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

async function sendEmailNotification(
  emailTemplate: NotificationData["emailTemplate"],
  userEmail: string | null | undefined
) {
  if (emailTemplate && userEmail) {
    await sendEmail({
      to: userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });
  }
}

async function sendSseNotification(
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    link: string | undefined;
    data: { notificationId: string };
    timestamp: Date;
  }
) {
  const sender = getSseSender();
  try {
    sender(userId, notification);
  } catch (error) {
    console.error("Failed to send SSE notification:", error);
  }
}

async function sendWhatsAppNotificationIfOptedIn(
  userId: string,
  notificationType: string,
  message: string,
  userPhone: string | null | undefined,
  userHasWhatsapp: boolean | undefined
) {
  if (!isWhatsAppEnabled() || !userHasWhatsapp) return;

  const to = formatE164(userPhone);
  if (!to) {
    console.warn("Skipped WhatsApp: invalid phone", { userId, type: notificationType });
    return;
  }

  const templateConfig =
    getTemplateConfigForType(notificationType) ?? getTemplateConfigForType("general");
  if (!templateConfig) {
    console.warn("Skipped WhatsApp: no template configured", { userId, type: notificationType });
    return;
  }

  const { name, paramCount } = templateConfig;
  const bodyParams = paramCount > 0 && message ? [message].slice(0, paramCount) : undefined;

  try {
    await sendWhatsAppTemplate(to, name, {
      bodyParams,
      languageCode: process.env.WHATSAPP_LANGUAGE_CODE || "en_US",
    });
  } catch (err) {
    console.error("Failed to send WhatsApp notification:", err);
  }
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

  // Fetch user info for channels (email, WhatsApp)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true, hasWhatsapp: true },
  });

  // Send through all channels
  if (shouldSendEmail) {
    await sendEmailNotification(emailTemplate, user?.email);
  }

  await sendSseNotification(userId, {
    type,
    title,
    message,
    link: link || undefined,
    data: { notificationId: notification.id },
    timestamp: new Date(),
  });

  await sendWhatsAppNotificationIfOptedIn(userId, type, message, user?.phone, user?.hasWhatsapp);

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

function getLinkForNotificationRecipient(
  recipientRole: string | undefined | null,
  requestId: string,
  isAssigned: boolean
): string {
  if (recipientRole === "CLIENT") return `/client/requests/${requestId}`;
  if (recipientRole === "PROVIDER") {
    return isAssigned ? `/provider/requests/${requestId}` : `/provider/available/${requestId}`;
  }
  return `/provider/requests/${requestId}`;
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
  const isAssigned = request.providerId === recipientId;
  const link = getLinkForNotificationRecipient(user?.role, requestId, isAssigned);

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
    message: `Your request "${request.title}" status changed from ${oldStatus.replaceAll("_", " ")} to ${newStatus.replaceAll("_", " ")}`,
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

const ROLE_NOTIFICATION_LINKS: Record<string, string> = {
  CLIENT: "/client",
  PROVIDER: "/provider",
  SUPER_ADMIN: "/admin",
};

export async function sendWelcomeEmail(params: {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const { userId, userName, userEmail, userRole } = params;
  const emailTemplate = getWelcomeEmailTemplate(userName, userRole);
  const notificationLink = ROLE_NOTIFICATION_LINKS[userRole] || "/";

  try {
    await sendEmail({
      to: userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

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
  }
}
