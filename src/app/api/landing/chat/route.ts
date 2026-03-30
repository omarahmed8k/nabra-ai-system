import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  prompt: z.string().min(2).max(1800),
  locale: z.enum(["en", "ar"]).optional().default("en"),
});

function resolveKnowledgeFilePath() {
  const configuredPath = "docs/NABARAWY_KNOWLEDGE.md";
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), configuredPath);
}

async function loadKnowledgeBase() {
  try {
    const filePath = resolveKnowledgeFilePath();
    const content = await readFile(filePath, "utf8");
    return content.trim();
  } catch {
    return "";
  }
}

function buildSystemPrompt(locale: "en" | "ar", knowledgeBase: string, origin: string) {
  const languageRule =
    locale === "ar"
      ? "Always respond in Arabic unless the user asks for English."
      : "Always respond in English unless the user asks for Arabic.";

  const styleRule =
    locale === "ar"
      ? [
          "Response format is mandatory:",
          '1) Start with exactly this opening line: "أنا نبراوي، وأقدر أساعدك بطريقة حديثة واحترافية."',
          "2) Immediately add a short numbered line of what you can provide in this request (1, 2, 3).",
          "3) Then provide a practical direct answer to the user request.",
          "4) Never use refusal phrasing like 'لا أستطيع' or 'لا يمكنني المساعدة' for normal business/creative requests.",
          "5) If details are incomplete, ask the user to register/login and submit full request details so the team can serve accurately.",
          `3) End with a registration CTA line that includes a markdown link to client form: [للتجربة والتسجيل](${origin}/forms/client).`,
          `4) If the user asks about becoming a provider, also include a markdown link: [تسجيل مقدمي الخدمة](${origin}/forms/provider).`,
          "5) CTA tone should feel energetic and inviting (example: let's try me now).",
        ].join(" ")
      : [
          "Response format is mandatory:",
          '1) Start with exactly this opening line: "I am Nabarawy. I can handle this for you in a modern, professional way."',
          "2) Immediately add a short numbered line of what you can provide in this request (1, 2, 3).",
          "3) Then provide a practical direct answer to the user request.",
          "4) Never use refusal phrasing like 'I can't assist' for normal business/creative requests.",
          "5) If details are incomplete, ask the user to register/login and submit full request details so the team can serve accurately.",
          `3) End with a registration CTA line that includes a markdown link to client form: [Let's register and try me](${origin}/forms/client).`,
          `4) If the user asks about becoming a provider, also include a markdown link: [Provider registration](${origin}/forms/provider).`,
          "5) CTA tone should feel energetic and inviting (example: let's try me now).",
        ].join(" ");

  const knowledge = knowledgeBase
    ? knowledgeBase.slice(0, 14000)
    : "No knowledge file was provided.";

  return [
    "You are Nabarawy an AI assistant.",
    "Keep answers concise, clear, and practical.",
    "Do not invent unavailable company details. If details are missing, ask for registration/login and full request details instead of refusal-style wording.",
    languageRule,
    styleRule,
    "Use the following knowledge base as the primary source of truth:",
    knowledge,
  ].join("\n\n");
}

function ensureFormLinks(reply: string, origin: string, locale: "en" | "ar") {
  const clientText = locale === "ar" ? "للتجربة والتسجيل" : "Let's register and try me";
  const providerText = locale === "ar" ? "تسجيل مقدمي الخدمة" : "Provider registration";

  const clientLink = `[${clientText}](${origin}/forms/client)`;
  const providerLink = `[${providerText}](${origin}/forms/provider)`;

  // Normalize existing markdown links to always use current origin.
  const normalizedMarkdown = reply
    .replaceAll(
      /\[([^\]]+)\]\((?:https?:\/\/[^\s)]+)?\/forms\/client\)/g,
      (_match, label: string) => `[${label}](${origin}/forms/client)`
    )
    .replaceAll(
      /\[([^\]]+)\]\((?:https?:\/\/[^\s)]+)?\/forms\/provider\)/g,
      (_match, label: string) => `[${label}](${origin}/forms/provider)`
    );

  // Convert bare path mentions to clickable markdown links.
  return normalizedMarkdown
    .replaceAll(/(^|[\s(])\/forms\/client\b/g, `$1${clientLink}`)
    .replaceAll(/(^|[\s(])\/forms\/provider\b/g, `$1${providerLink}`);
}

function parseTemperature(raw?: string) {
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return 0.3;
  return Math.min(2, Math.max(0, parsed));
}

function parseMaxTokens(raw?: string) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 420;
  return Math.min(1200, Math.max(80, Math.floor(parsed)));
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = BodySchema.parse(json);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const origin = new URL(req.url).origin;
    const knowledgeBase = await loadKnowledgeBase();
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const temperature = parseTemperature(process.env.OPENAI_TEMPERATURE);
    const maxTokens = parseMaxTokens(process.env.OPENAI_MAX_TOKENS);

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(body.locale, knowledgeBase, origin),
          },
          {
            role: "user",
            content: body.prompt,
          },
        ],
      }),
    });

    if (!openAIResponse.ok) {
      const failure = await openAIResponse.text();
      console.error("OpenAI chat completion failed:", failure);
      return NextResponse.json({ error: "Failed to generate reply" }, { status: 502 });
    }

    const data = (await openAIResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawReply = data.choices?.[0]?.message?.content?.trim();

    if (!rawReply) {
      return NextResponse.json({ error: "Empty model response" }, { status: 502 });
    }

    const reply = ensureFormLinks(rawReply, origin, body.locale);

    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    console.error("Landing chat route error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
