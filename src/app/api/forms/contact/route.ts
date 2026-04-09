import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/notifications/email";

export const runtime = "nodejs";

const BodySchema = z.object({
  type: z.enum(["client", "provider"]),
  fullName: z.string().min(2).max(100),
  email: z.string().email().max(254),
  whatsapp: z.string().min(3).max(50),
  company: z.string().max(120).optional().default(""),
  website: z.string().max(300).optional().default(""),
  message: z.string().min(10).max(4000),
});

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(req: Request) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return NextResponse.json({ ok: false, error: "Email not configured" }, { status: 500 });
    }

    const json = await req.json();
    const body = BodySchema.parse(json);

    const subject =
      body.type === "provider"
        ? `Provider form submission — ${body.fullName}`
        : `Client form submission — ${body.fullName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">New ${escapeHtml(body.type)} submission</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 14px 0;">
          <tr><td style="padding: 6px 0; color: #555; width: 160px;">Name</td><td style="padding: 6px 0;"><strong>${escapeHtml(body.fullName)}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #555;">Email</td><td style="padding: 6px 0;">${escapeHtml(body.email)}</td></tr>
          <tr><td style="padding: 6px 0; color: #555;">WhatsApp</td><td style="padding: 6px 0;">${escapeHtml(body.whatsapp)}</td></tr>
          <tr><td style="padding: 6px 0; color: #555;">Company</td><td style="padding: 6px 0;">${escapeHtml(body.company || "-")}</td></tr>
          <tr><td style="padding: 6px 0; color: #555;">Website</td><td style="padding: 6px 0;">${escapeHtml(body.website || "-")}</td></tr>
        </table>
        <h3 style="margin: 18px 0 8px;">Message</h3>
        <div style="white-space: pre-wrap; background: #f7f7f7; border: 1px solid #eee; border-radius: 8px; padding: 12px;">
          ${escapeHtml(body.message)}
        </div>
      </div>
    `;

    const recipient = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const ok = await sendEmail({
      to: recipient,
      subject,
      html,
      replyTo: body.email,
    });

    if (!ok) {
      return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}
