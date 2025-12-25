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
import { getTranslation } from "./i18n-helper";

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
  locale?: string;
  emailTemplate?: {
    subject: string;
    html: string;
  };
  sseI18n?: {
    titleKey?: string;
    titleParams?: Record<string, string>;
    messageKey?: string;
    messageParams?: Record<string, string>;
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
    i18n?: {
      titleKey?: string;
      titleParams?: Record<string, string>;
      messageKey?: string;
      messageParams?: Record<string, string>;
    };
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
  userHasWhatsapp: boolean | undefined,
  locale: string = "en"
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
    // Map locale to WhatsApp language code (en -> en_US, ar -> ar)
    const whatsappLocale = locale === "ar" ? "ar" : "en_US";
    await sendWhatsAppTemplate(to, name, {
      bodyParams,
      languageCode: whatsappLocale,
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
    locale = "en",
    emailTemplate,
    sseI18n,
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
    i18n: sseI18n,
  });

  await sendWhatsAppNotificationIfOptedIn(
    userId,
    type,
    message,
    user?.phone,
    user?.hasWhatsapp,
    locale
  );

  return notification;
}

export async function notifyAdminsNewPendingPayment(params: {
  clientNameOrEmail: string;
  amount: number;
  currency: string;
  locale?: string;
}) {
  const { clientNameOrEmail, amount, currency, locale = "en" } = params;

  const admins = await db.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { id: true, email: true },
  });

  const title = await getTranslation(locale, "notifications.paymentVerification.title");
  const message = await getTranslation(locale, "notifications.paymentVerification.message", {
    clientNameOrEmail,
    amount: amount.toFixed(2),
    currency,
  });
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
        locale,
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
  senderRole?: string;
  recipientId: string;
  messagePreview: string;
  locale?: string;
}) {
  const { requestId, senderName, recipientId, messagePreview, locale = "en" } = params;

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

  const displayName =
    params.senderRole === "CLIENT"
      ? await getTranslation(locale, "common.roles.CLIENT")
      : senderName;
  const title = await getTranslation(locale, "notifications.newMessage.title", {
    senderName: displayName,
  });
  const message = await getTranslation(locale, "notifications.newMessage.message", {
    messagePreview,
  });
  const emailTemplate = await getNewMessageEmailTemplate(
    senderName,
    request.title,
    messagePreview,
    locale
  );
  const isAssigned = request.providerId === recipientId;
  const link = getLinkForNotificationRecipient(user?.role, requestId, isAssigned);

  return createNotification({
    userId: recipientId,
    title,
    message: message,
    type: "message",
    link,
    locale,
    emailTemplate,
    sseI18n: {
      titleKey: "notifications.newMessage.title",
      titleParams: { senderName: displayName },
      messageKey: "notifications.newMessage.message",
      messageParams: { messagePreview },
    },
  });
}

export async function notifyStatusChange(params: {
  requestId: string;
  userId: string;
  oldStatus: string;
  newStatus: string;
  locale?: string;
}) {
  const { requestId, userId, oldStatus, newStatus, locale = "en" } = params;

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

  const title = await getTranslation(locale, "notifications.statusChange.title");
  const message = await getTranslation(locale, "notifications.statusChange.message", {
    requestTitle: request.title,
    oldStatus: oldStatus.replaceAll("_", " "),
    newStatus: newStatus.replaceAll("_", " "),
  });
  const emailTemplate = await getStatusChangeEmailTemplate(
    request.title,
    oldStatus,
    newStatus,
    locale
  );
  const linkPrefix = user?.role === "CLIENT" ? "/client" : "/provider";

  return createNotification({
    userId,
    title,
    message,
    type: "status_change",
    link: `${linkPrefix}/requests/${requestId}`,
    locale,
    emailTemplate,
    sseI18n: {
      titleKey: "notifications.statusChange.title",
      messageKey: "notifications.statusChange.message",
      messageParams: {
        requestTitle: request.title,
        oldStatus: oldStatus.replaceAll("_", " "),
        newStatus: newStatus.replaceAll("_", " "),
      },
    },
  });
}

export async function notifyProviderAssignment(params: {
  requestId: string;
  providerId: string;
  providerName: string;
  locale?: string;
}) {
  const { requestId, providerId, providerName, locale = "en" } = params;

  const request = await db.request.findUnique({
    where: { id: requestId },
    select: { title: true },
  });

  if (!request) return;

  const title = await getTranslation(locale, "notifications.assignment.title");
  const message = await getTranslation(locale, "notifications.assignment.message", {
    requestTitle: request.title,
  });
  const emailTemplate = await getAssignmentEmailTemplate(request.title, providerName, locale);

  return createNotification({
    userId: providerId,
    title,
    message,
    type: "assignment",
    link: `/provider/my-requests`,
    locale,
    emailTemplate,
  });
}

export async function notifySubscriptionExpiring(params: {
  userId: string;
  packageName: string;
  daysRemaining: number;
  remainingCredits: number;
  locale?: string;
}) {
  const { userId, packageName, daysRemaining, remainingCredits, locale = "en" } = params;

  const title = await getTranslation(locale, "notifications.subscriptionExpiring.title", {
    packageName,
    daysRemaining: daysRemaining.toString(),
  });
  const message = await getTranslation(locale, "notifications.subscriptionExpiring.message", {
    packageName,
    daysRemaining: daysRemaining.toString(),
  });
  const emailTemplate = await getSubscriptionExpiringEmailTemplate(
    packageName,
    daysRemaining,
    remainingCredits,
    locale
  );

  return createNotification({
    userId,
    title,
    message,
    type: "general",
    link: `/client/subscription`,
    locale,
    emailTemplate,
  });
}

export async function notifySubscriptionExpired(params: {
  userId: string;
  packageName: string;
  locale?: string;
}) {
  const { userId, packageName, locale = "en" } = params;

  const title = await getTranslation(locale, "notifications.subscriptionExpired.title", {
    packageName,
  });
  const message = await getTranslation(locale, "notifications.subscriptionExpired.message", {
    packageName,
  });
  const emailTemplate = await getSubscriptionExpiredEmailTemplate(packageName, locale);

  return createNotification({
    userId,
    title,
    message,
    type: "general",
    link: `/client/subscription`,
    locale,
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
  locale?: string;
}) {
  const { userId, userName, userEmail, userRole, locale = "en" } = params;

  const title = await getTranslation(locale, "notifications.welcome.title", { userName });
  const message = await getTranslation(locale, "notifications.welcome.message", { userName });
  const emailTemplate = await getWelcomeEmailTemplate(userName, userRole, locale);
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
        title,
        message,
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
