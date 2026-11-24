import "server-only";
import { Resend } from "resend";
import { RequestError } from "./security";
import { welcomeUnsubscribeToken } from "./waitlist-unsubscribe";
import { collectiveWelcome } from "./welcome-email";

export function mailConfiguration() {
  const { RESEND_API_KEY, EMAIL_FROM, APP_URL } = process.env;
  if (!RESEND_API_KEY || !EMAIL_FROM || !APP_URL) throw new RequestError("Email is temporarily unavailable. Please try again later.", 503);
  return { resend: new Resend(RESEND_API_KEY), from: EMAIL_FROM, base: new URL(APP_URL).origin };
}

export type WelcomeRecipient = { id: string; email: string; unsubscribeHash: string };

export function sendWelcome(configuration: ReturnType<typeof mailConfiguration>, recipient: WelcomeRecipient, marketingAddress?: string) {
  const { resend, from, base } = configuration;
  const token = welcomeUnsubscribeToken(recipient.id, recipient.unsubscribeHash);
  const unsubscribe = `${base}/unsubscribe#${token}`;
  const oneClick = new URL("/api/waitlist/unsubscribe", base);
  oneClick.searchParams.set("token", token);

  return resend.emails.send({
    from,
    to: recipient.email,
    ...collectiveWelcome(base, unsubscribe, marketingAddress),
    headers: { "List-Unsubscribe": `<${oneClick.href}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  }, { idempotencyKey: `bkr-waitlist-welcome/${recipient.id}` });
}
