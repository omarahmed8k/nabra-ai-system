import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  // Use environment variables for email configuration
  const emailConfig = {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number.parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  };

  transporter = nodemailer.createTransport(emailConfig);
  return transporter;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  // Skip if email is not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn("Email not configured. Skipping email notification.");
    return false;
  }

  try {
    const transport = getTransporter();

    await transport?.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text: text || html.replaceAll(/<[^>]*>/g, ""), // Strip HTML if no text provided
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Email templates
export function getNewMessageEmailTemplate(
  senderName: string,
  requestTitle: string,
  messagePreview: string
) {
  return {
    subject: `New message from ${senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Message Received</h2>
        <p><strong>${senderName}</strong> sent you a message regarding <strong>${requestTitle}</strong>:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;">${messagePreview}</p>
        </div>
        <p><a href="${process.env.NEXTAUTH_URL}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Message</a></p>
      </div>
    `,
  };
}

export function getStatusChangeEmailTemplate(
  requestTitle: string,
  oldStatus: string,
  newStatus: string
) {
  return {
    subject: `Request Status Updated: ${requestTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Request Status Changed</h2>
        <p>The status of your request <strong>${requestTitle}</strong> has been updated:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>From:</strong> ${oldStatus.replace("_", " ")}</p>
          <p style="margin: 10px 0 0;"><strong>To:</strong> ${newStatus.replace("_", " ")}</p>
        </div>
        <p><a href="${process.env.NEXTAUTH_URL}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Request</a></p>
      </div>
    `,
  };
}

export function getAssignmentEmailTemplate(requestTitle: string, providerName: string) {
  return {
    subject: `New Request Assigned: ${requestTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Request Assigned</h2>
        <p>You have been assigned to work on: <strong>${requestTitle}</strong></p>
        <p><a href="${process.env.NEXTAUTH_URL}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Request</a></p>
      </div>
    `,
  };
}

export function getSubscriptionExpiringEmailTemplate(
  packageName: string,
  daysRemaining: number,
  remainingCredits: number
) {
  return {
    subject: `⚠️ Your subscription expires in ${daysRemaining} days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9800;">⚠️ Subscription Expiring Soon</h2>
        <p>Your <strong>${packageName}</strong> subscription will expire in <strong>${daysRemaining} days</strong>.</p>
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Remaining Credits:</strong> ${remainingCredits}</p>
          <p style="margin: 10px 0 0;"><strong>Expiry Date:</strong> ${daysRemaining} days from now</p>
        </div>
        <p>Don't let your subscription expire! Renew now to continue enjoying uninterrupted service.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/client/subscription" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Renew Subscription</a></p>
      </div>
    `,
  };
}

export function getSubscriptionExpiredEmailTemplate(packageName: string) {
  return {
    subject: `❌ Your subscription has expired`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">❌ Subscription Expired</h2>
        <p>Your <strong>${packageName}</strong> subscription has expired.</p>
        <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;">You no longer have access to create new requests or use services.</p>
          <p style="margin: 10px 0 0;">Renew your subscription to continue using our platform.</p>
        </div>
        <p><a href="${process.env.NEXTAUTH_URL}/client/subscription" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Renew Now</a></p>
      </div>
    `,
  };
}

export function getWelcomeEmailTemplate(userName: string, userRole: string) {
  let dashboardLink: string;
  if (userRole === "CLIENT") {
    dashboardLink = `${process.env.NEXTAUTH_URL}/client`;
  } else if (userRole === "PROVIDER") {
    dashboardLink = `${process.env.NEXTAUTH_URL}/provider`;
  } else {
    dashboardLink = `${process.env.NEXTAUTH_URL}/admin`;
  }

  let quickStartGuide: string;
  if (userRole === "CLIENT") {
    quickStartGuide = `
          <div style="margin-bottom: 15px;">
            <strong style="color: #2563eb;">1. Choose a Package</strong>
            <p style="margin: 5px 0 0 0; color: #64748b;">Select a subscription package that fits your needs</p>
          </div>
          <div style="margin-bottom: 15px;">
            <strong style="color: #2563eb;">2. Create Your First Request</strong>
            <p style="margin: 5px 0 0 0; color: #64748b;">Submit a service request and let our providers help you</p>
          </div>
          <div style="margin-bottom: 15px;">
            <strong style="color: #2563eb;">3. Track Progress</strong>
            <p style="margin: 5px 0 0 0; color: #64748b;">Monitor your requests and communicate with providers in real-time</p>
          </div>
          `;
  } else if (userRole === "PROVIDER") {
    quickStartGuide = `
          <div style="margin-bottom: 15px;">
            <strong style="color: #2563eb;">1. Complete Your Profile</strong>
            <p style="margin: 5px 0 0 0; color: #64748b;">Add your skills and portfolio to attract clients</p>
          </div>
          <div style="margin-bottom: 15px;">
            <strong style="color: #2563eb;">2. Browse Available Requests</strong>
            <p style="margin: 5px 0 0 0; color: #64748b;">Check out client requests matching your expertise</p>
          </div>
          <div style="margin-bottom: 15px;">
            <strong style="color: #2563eb;">3. Start Working</strong>
            <p style="margin: 5px 0 0 0; color: #64748b;">Claim requests and deliver high-quality work</p>
          </div>
          `;
  } else {
    quickStartGuide = `
          <div style="margin-bottom: 15px;">
            <strong style="color: #2563eb;">1. Manage Users</strong>
            <p style="margin: 5px 0 0 0; color: #64748b;">View and manage all users on the platform</p>
          </div>
          <div style="margin-bottom: 15px;">
            <strong style="color: #2563eb;">2. Review Requests</strong>
            <p style="margin: 5px 0 0 0; color: #64748b;">Monitor and manage all service requests</p>
          </div>
          <div style="margin-bottom: 15px;">
            <strong style="color: #2563eb;">3. Configure Services</strong>
            <p style="margin: 5px 0 0 0; color: #64748b;">Set up packages, services, and platform settings</p>
          </div>
          `;
  }

  return {
    subject: `Welcome to Nabra AI System! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">Welcome to Nabra AI System!</h1>
          <p style="color: #64748b; margin-top: 10px;">We're excited to have you on board</p>
        </div>

        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 10px 0;">Hi ${userName}! 👋</h2>
          <p style="margin: 0; font-size: 16px; line-height: 1.6;">
            Thank you for joining Nabra AI System. Your account has been created successfully!
          </p>
        </div>

        <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
          <h3 style="color: #1e293b; margin-top: 0;">🚀 Quick Start Guide</h3>
          
          ${quickStartGuide}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardLink}" style="background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Go to Dashboard</a>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 5px;">
          <p style="margin: 0; color: #92400e;"><strong>💡 Pro Tip:</strong> Enable desktop notifications to stay updated on your requests in real-time!</p>
        </div>

        <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">Need help getting started?</p>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0;">
            📧 Email us at: <a href="mailto:${process.env.EMAIL_FROM}" style="color: #2563eb;">${process.env.EMAIL_FROM}</a>
          </p>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0;">
            💬 Visit our help center or contact support
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 5px 0;">
            © ${new Date().getFullYear()} Nabra AI System. All rights reserved.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 5px 0;">
            You received this email because you signed up for Nabra AI System.
          </p>
        </div>
      </div>
    `,
  };
}
