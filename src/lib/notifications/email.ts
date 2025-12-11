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
