import "server-only";
import { Resend } from "resend";
import { RequestError } from "./security";

export function mailConfiguration() {
  const { RESEND_API_KEY, EMAIL_FROM, APP_URL } = process.env;
  if (!RESEND_API_KEY || !EMAIL_FROM || !APP_URL) throw new RequestError("Email is temporarily unavailable. Please try again later.", 503);
  return { resend: new Resend(RESEND_API_KEY), from: EMAIL_FROM, base: new URL(APP_URL).origin };
}

export async function sendConfirmation(configuration: ReturnType<typeof mailConfiguration>, email: string, confirmation: string, unsubscribe: string) {
  const { resend, from, base } = configuration;
  const response = await resend.emails.send({
    from,
    to: email,
    subject: "Confirm your bkr email address",
    text: `Thank you for your interest in bkr. Confirm your email address for the founding community:\n\n${base}/community/confirm#${confirmation}\n\nThis link expires in 48 hours. You can manage your email preferences here:\n${base}/unsubscribe#${unsubscribe}`,
  });
  if (response.error) throw new RequestError("We couldn’t send your confirmation email. Please try again.", 503);
}
