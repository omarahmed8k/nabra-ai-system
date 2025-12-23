import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  isWhatsAppEnabled,
  formatE164,
  sendWhatsAppTemplate,
  getTemplateConfigForType,
} from "@/lib/notifications/whatsapp";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Allow SUPER_ADMIN, or allow a user to test sending to their own number
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, phone: true, hasWhatsapp: true },
  });

  if (!isWhatsAppEnabled()) {
    return NextResponse.json({ error: "WhatsApp not enabled" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const toRaw: string | undefined = body.to;
  const templateRaw: string | undefined = body.template;
  const type: string | undefined = body.type; // optional: message | status_change | assignment | general
  const languageCode: string | undefined = body.languageCode;
  const params: string[] | undefined = body.params;

  const to = formatE164(toRaw ?? "");
  if (!to) {
    return NextResponse.json({ error: "Invalid E.164 phone in 'to'" }, { status: 400 });
  }

  const isAdmin = me?.role === "SUPER_ADMIN";
  const isSelfTest = me?.phone && formatE164(me.phone) === to && me?.hasWhatsapp;

  // Allow testing to any existing user in DB who hasWhatsapp=true
  // Try exact match, then fallback to normalization against all opted-in users
  let target = await db.user.findFirst({
    where: { phone: to },
    select: { id: true, hasWhatsapp: true, phone: true },
  });
  if (!target) {
    const phoneNoPlus = to.replace(/^\+/, "");
    target = await db.user.findFirst({
      where: { phone: phoneNoPlus },
      select: { id: true, hasWhatsapp: true, phone: true },
    });
  }
  if (!target) {
    const candidates = await db.user.findMany({
      where: { hasWhatsapp: true, phone: { not: null } },
      select: { id: true, hasWhatsapp: true, phone: true },
      take: 50, // safety limit
    });
    target = candidates.find((c) => formatE164(c.phone) === to) || (undefined as any);
  }

  const isTargetOptedIn = !!target?.hasWhatsapp;

  if (!isAdmin && !isSelfTest && !isTargetOptedIn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cfg = type ? getTemplateConfigForType(type) : null;
  let templateName = templateRaw ?? cfg?.name;
  if (!templateName) {
    return NextResponse.json(
      { error: "Missing template name (provide 'template' or set env for 'type')" },
      { status: 400 }
    );
  }

  let bodyParams = params && Array.isArray(params) ? [...params] : undefined;
  if (cfg) {
    if (cfg.paramCount === 0) {
      bodyParams = undefined; // template expects no params
    } else if (cfg.paramCount > 0 && bodyParams && bodyParams.length > cfg.paramCount) {
      bodyParams = bodyParams.slice(0, cfg.paramCount); // trim extras
    }
  }

  try {
    const res = await sendWhatsAppTemplate(to, templateName, {
      languageCode,
      bodyParams,
    });
    return NextResponse.json({ success: true, apiResponse: res });
  } catch (err: any) {
    const message = err?.message || String(err);
    return NextResponse.json({ error: "WhatsApp send failed", details: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Convenience GET for quick browser checks: /api/whatsapp-test?to=+15551234567&type=general&params=Hello
  const url = new URL(req.url);
  const toRaw = url.searchParams.get("to") || undefined;
  const type = url.searchParams.get("type") || undefined;
  const template = url.searchParams.get("template") || undefined;
  const languageCode = url.searchParams.get("languageCode") || undefined;
  const paramsAll = url.searchParams.getAll("params");

  // Reuse POST handler logic
  return POST(
    new Request(req.url, {
      method: "POST",
      body: JSON.stringify({ to: toRaw, type, template, languageCode, params: paramsAll }),
      headers: { "Content-Type": "application/json" },
    })
  );
}
