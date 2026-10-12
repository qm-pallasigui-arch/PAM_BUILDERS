import { Resend } from "resend";

// ─────────────────────────────────────────────────────────────────────────────
// This is a Vercel Serverless Function.
// It runs on Vercel's servers — NOT in the browser — so your API key is safe.
// The RESEND_API_KEY is pulled from Vercel's Environment Variables (never hardcoded).
// ─────────────────────────────────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);

const MAX_BODY_BYTES = 10_000;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 15;
const MAX_PROJECT_TYPE_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });

const normalizeText = (value: unknown, maxLength: number) =>
  escapeHtml(String(value ?? "").trim().slice(0, maxLength));

const normalizeEmail = (value: unknown) =>
  String(value ?? "").trim().replace(/[\r\n]/g, "").slice(0, MAX_EMAIL_LENGTH);

const normalizePhone = (value: unknown) =>
  String(value ?? "").replace(/\D/g, "").slice(0, MAX_PHONE_LENGTH);

const getClientIp = (req: any) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  if (typeof value === "string" && value.trim()) {
    return value.split(",")[0].trim();
  }
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }
  return req.socket?.remoteAddress || "unknown";
};

const isAllowedOrigin = (req: any) => {
  const host = String(req.headers.host || "").trim();
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const candidates = [origin, referer].filter(Boolean) as string[];

  if (!host || candidates.length === 0) {
    return true;
  }

  return candidates.some((candidate) => {
    try {
      return new URL(candidate).host === host;
    } catch {
      return false;
    }
  });
};

const isRateLimited = (req: any) => {
  const ip = getClientIp(req);
  const now = Date.now();

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  const entry = rateLimitStore.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return false;
};

// Email settings are read from environment variables so they can be
// configured per-deployment without editing source code. Falls back to
// sensible defaults for local development.
const RECEIVING_EMAIL = process.env.RECEIVING_EMAIL || "mipallasigui@gmail.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
const FROM_NAME = process.env.FROM_NAME || "PAM Builders";

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Fail-fast in production: ensure critical environment variables are set
  if (process.env.NODE_ENV === "production") {
    const missing: string[] = [];
    if (!process.env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
    if (!process.env.RECEIVING_EMAIL) missing.push("RECEIVING_EMAIL");
    if (missing.length) {
      console.error("Missing required environment variables:", missing.join(", "));
      return res.status(500).json({ error: "Server misconfiguration." });
    }
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "Payload too large." });
  }

  if (isRateLimited(req)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const { name, email, phone, projectType, message, honeypot } = req.body;

  // ── Honeypot spam check ──────────────────────────────────────────────────
  // Real users never see or fill this field. Bots fill everything — caught!
  if (honeypot) {
    // Pretend it succeeded so bots don't know they were caught
    return res.status(200).json({ success: true });
  }

  // ── Basic server-side validation ─────────────────────────────────────────
  const safeName = normalizeText(name, MAX_NAME_LENGTH);
  const safeEmail = normalizeEmail(email);
  const safePhone = normalizePhone(phone);
  const safeProjectType = normalizeText(projectType, MAX_PROJECT_TYPE_LENGTH);
  const safeMessage = normalizeText(message, MAX_MESSAGE_LENGTH);

  if (!safeName || !safeEmail || !safeProjectType || !safeMessage) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(safeEmail)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  if (safePhone && (safePhone.length < 7 || safePhone.length > MAX_PHONE_LENGTH)) {
    return res.status(400).json({ error: "Invalid phone number." });
  }

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: RECEIVING_EMAIL,
      replyTo: safeEmail, // So you can reply directly to the client
      subject: `New Inquiry: ${safeProjectType} — from ${safeName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #ea580c; margin-top: 0;">New Project Inquiry</h2>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">Full Name:</td>
              <td style="padding: 8px 0; color: #111827;">${safeName}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 8px 4px; font-weight: bold; color: #374151;">Email:</td>
              <td style="padding: 8px 4px; color: #111827;">
                <a href="mailto:${safeEmail}" style="color: #ea580c;">${safeEmail}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone:</td>
              <td style="padding: 8px 0; color: #111827;">${safePhone || "Not provided"}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 8px 4px; font-weight: bold; color: #374151;">Project Type:</td>
              <td style="padding: 8px 4px; color: #111827;">${safeProjectType}</td>
            </tr>
          </table>

          <div style="margin-top: 20px;">
            <p style="font-weight: bold; color: #374151; margin-bottom: 8px;">Project Details:</p>
            <div style="background: #f9fafb; padding: 16px; border-radius: 6px; color: #111827; white-space: pre-wrap;">${safeMessage}</div>
          </div>

          <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
            This inquiry was submitted via your website contact form.
            Reply directly to this email to respond to ${safeName}.
          </p>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Resend error:", error);
    return res.status(500).json({ error: "Failed to send email. Please try again." });
  }
}
