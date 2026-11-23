import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

export class RequestError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export const secretToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const cookieOptions = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" } as const;
const day = 86400000;

export async function anonymousSession() {
  const jar = await cookies();
  const existing = jar.get("ml_research")?.value;
  if (existing && /^[A-Za-z0-9_-]{43}$/.test(existing)) return hashToken(existing);
  const token = secretToken();
  jar.set("ml_research", token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
  return hashToken(token);
}

export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_URL ? new URL(process.env.APP_URL).origin : new URL(request.url).origin;
  if (origin && origin !== expected) throw new RequestError("This request came from an unrecognized page.", 403);
  if (!origin && request.headers.get("sec-fetch-site") === "cross-site") throw new RequestError("This request came from an unrecognized page.", 403);
}

export async function rateLimit(headers: Headers, action: string, limit: number, windowMs: number, subject?: string) {
  const keySecret = process.env.RATE_LIMIT_SECRET || (process.env.NODE_ENV !== "production" ? "local-development-rate-limit" : "");
  if (!keySecret) throw new RequestError("Submissions are temporarily unavailable.", 503);
  // Vercel overwrites this header. Other hosts may set a trusted client IP header on their own proxy.
  const trustedHeader = process.env.TRUSTED_IP_HEADER || (process.env.VERCEL ? "x-vercel-forwarded-for" : undefined);
  const clientIp = trustedHeader ? headers.get(trustedHeader)?.split(",")[0]?.trim() : undefined;
  const identity = subject ?? clientIp ?? (await anonymousSession());
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const key = createHmac("sha256", keySecret).update(JSON.stringify([action, identity, windowStart])).digest("hex");
  const tally = await db.rateLimit.upsert({
    where: { key },
    create: { key, expiresAt: new Date(windowStart + windowMs) },
    update: { count: { increment: 1 } },
  });
  if (tally.count > limit) throw new RequestError("Too many attempts. Please try again later.", 429);
  if (Math.random() < .01) await db.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - day) } } });
}

export async function verifyChallenge(token: string | undefined, website: string | undefined) {
  if (website) throw new RequestError("We couldn’t verify this submission.");
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new RequestError("Submission verification is temporarily unavailable.", 503);
    return;
  }
  if (!token) throw new RequestError("Please complete the verification before submitting.");
  const address = process.env.APP_URL && new URL(process.env.APP_URL).hostname;
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token }),
    signal: AbortSignal.timeout(8000),
  });
  const result: { success?: boolean; hostname?: string } = await response.json();
  if (!response.ok || !result.success || (address && process.env.NODE_ENV === "production" && result.hostname !== address)) {
    throw new RequestError("Verification expired. Please try again.");
  }
}

export function safeEqual(left: Buffer, right: Buffer) {
  return left.length === right.length && timingSafeEqual(left, right);
}
