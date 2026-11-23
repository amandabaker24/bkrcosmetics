import "server-only";
import { type Prisma } from "@prisma/client";
import { db } from "./db";
import { mailConfiguration, sendWelcome } from "./mail";

const minute = 60_000;
const retryDelay = 5 * minute;
// Resend holds an idempotency key for 24 hours. Stop retrying before it expires.
const retryWindow = 23 * 60 * minute;

function eligible(now: Date): Prisma.WaitlistSubscriberWhereInput {
  return {
    marketingConsent: true,
    confirmedAt: { not: null },
    unsubscribedAt: null,
    welcomeSentAt: null,
    welcomeQueuedAt: { gt: new Date(+now - retryWindow), lte: now },
    OR: [{ welcomeAttemptedAt: null }, { welcomeAttemptedAt: { lte: new Date(+now - retryDelay) } }],
  };
}

const recipientFields = { id: true, email: true, unsubscribeHash: true } as const;

export async function deliverWaitlistWelcome(id: string): Promise<"sent" | "skipped" | "failed"> {
  const postalAddress = process.env.MARKETING_POSTAL_ADDRESS?.trim();
  if (!postalAddress) return "skipped";

  try {
    const config = mailConfiguration();
    const now = new Date();
    const [recipient] = await db.waitlistSubscriber.updateManyAndReturn({
      where: { id, ...eligible(now) },
      data: { welcomeAttemptedAt: now },
      select: recipientFields,
    });
    if (!recipient) return "skipped";

    const active = await db.waitlistSubscriber.count({
      where: { id, marketingConsent: true, unsubscribedAt: null, unsubscribeHash: recipient.unsubscribeHash },
    });
    if (!active) return "skipped";

    const result = await sendWelcome(config, recipient, postalAddress);
    if (result.error) {
      console.error(JSON.stringify({ event: "waitlist_welcome_failed", code: result.error.name }));
      return "failed";
    }
    await db.waitlistSubscriber.update({
      where: { id },
      data: { welcomeSentAt: new Date(), welcomeQueuedAt: null },
    });
    return "sent";
  } catch {
    console.error(JSON.stringify({ event: "waitlist_welcome_failed", code: "delivery_unavailable" }));
    return "failed";
  }
}

export async function retryWaitlistWelcomes() {
  const pending = await db.waitlistSubscriber.findMany({
    where: eligible(new Date()),
    orderBy: { welcomeQueuedAt: "asc" },
    select: { id: true },
    take: 10,
  });
  const results = { sent: 0, skipped: 0, failed: 0 };
  for (const { id } of pending) results[await deliverWaitlistWelcome(id)]++;
  return results;
}
