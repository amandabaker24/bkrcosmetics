import "server-only";
import { createHmac } from "node:crypto";
import { db } from "./db";
import { hashToken, safeEqual } from "./security";

function signature(id: string, unsubscribeHash: string) {
  return createHmac("sha256", Buffer.from(unsubscribeHash, "hex"))
    .update(`bkr/welcome-unsubscribe/v1/${id}`).digest("base64url");
}

export function welcomeUnsubscribeToken(id: string, unsubscribeHash: string) {
  return `${id}.${signature(id, unsubscribeHash)}`;
}

export async function unsubscribeWaitlist(token: string) {
  const [id, provided] = token.split(".");
  const subscriber = provided
    ? await db.waitlistSubscriber.findUnique({ where: { id }, select: { id: true, unsubscribeHash: true } })
    : await db.waitlistSubscriber.findUnique({ where: { unsubscribeHash: hashToken(token) }, select: { id: true, unsubscribeHash: true } });
  if (!subscriber) return false;
  if (provided && !safeEqual(Buffer.from(provided), Buffer.from(signature(subscriber.id, subscriber.unsubscribeHash)))) return false;

  await db.waitlistSubscriber.updateMany({
    where: { id: subscriber.id, unsubscribeHash: subscriber.unsubscribeHash, unsubscribedAt: null },
    data: { marketingConsent: false, unsubscribedAt: new Date(), confirmationHash: null, confirmationExpiry: null, welcomeQueuedAt: null },
  });
  return true;
}
