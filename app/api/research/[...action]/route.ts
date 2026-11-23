import { Prisma } from "@prisma/client";
import { after } from "next/server";
import { type z } from "zod";
import { db } from "@/lib/db";
import { assertOrigin, anonymousSession, hashToken, rateLimit, RequestError, secretToken, verifyChallenge } from "@/lib/security";
import { requestKeySchema, requestSchemas } from "@/lib/requests";
import { answerSchemas, consentVersion, surveyVersion } from "@/lib/survey";
import { mailConfiguration, sendConfirmation } from "@/lib/mail";
import { unsubscribeWaitlist } from "@/lib/waitlist-unsubscribe";
import { deliverWaitlistWelcome } from "@/lib/waitlist-welcome";

type Handlers = { [K in keyof typeof requestSchemas]: (data: z.infer<(typeof requestSchemas)[K]>, headers: Headers) => Promise<object> };
const hour = 3600000;

const handlers: Handlers = {
  async "survey/start"({ tracking, token, website }, headers) {
    const anonymousSessionId = await anonymousSession();
    await rateLimit(headers, "survey-start", 20, hour);
    const existing = await db.surveySession.findUnique({ where: { anonymousSessionId_surveyVersion: { anonymousSessionId, surveyVersion } }, include: { responses: true } });
    if (existing) return { status: existing.status, answers: Object.fromEntries(existing.responses.map(({ questionKey, answerJson }) => [questionKey, answerJson])) };
    await verifyChallenge(token, website);
    const session = await db.surveySession.upsert({
      where: { anonymousSessionId_surveyVersion: { anonymousSessionId, surveyVersion } },
      update: {},
      create: { anonymousSessionId, source: tracking.source ?? "direct", campaign: tracking.campaign, surveyVersion },
    });
    return { status: session.status, answers: {} };
  },
  async "survey/progress"({ key, answer }, headers) {
    const anonymousSessionId = await anonymousSession();
    await rateLimit(headers, "survey-progress", 180, hour, anonymousSessionId);
    const value = answerSchemas[key].parse(answer);
    await db.$transaction(async tx => {
      // Lock the open session row before updating responses so completion always wins.
      const active = await tx.surveySession.updateMany({ where: { anonymousSessionId, surveyVersion, status: "IN_PROGRESS" }, data: { status: "IN_PROGRESS" } });
      if (!active.count) throw new RequestError("This survey session is closed or expired.", 409);
      const { id } = await tx.surveySession.findUniqueOrThrow({ where: { anonymousSessionId_surveyVersion: { anonymousSessionId, surveyVersion } }, select: { id: true } });
      if (value !== undefined) {
        const answerJson = value as Prisma.InputJsonValue;
        await tx.surveyResponse.upsert({
          where: { surveySessionId_questionKey: { surveySessionId: id, questionKey: key } },
          create: { surveySessionId: id, questionKey: key, answerJson }, update: { answerJson },
        });
      }
    });
    return { ok: true };
  },
  async "survey/complete"({ answers }, headers) {
    const anonymousSessionId = await anonymousSession();
    await rateLimit(headers, "survey-complete", 25, hour);
    const recorded = await db.$transaction(async tx => {
      const session = await tx.surveySession.findUnique({ where: { anonymousSessionId_surveyVersion: { anonymousSessionId, surveyVersion } } });
      if (!session) throw new RequestError("Start the survey before submitting it.", 409);
      const completed = await tx.surveySession.updateMany({
        where: { id: session.id, status: "IN_PROGRESS" },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      if (!completed.count) return false;
      await tx.surveyResponse.deleteMany({ where: { surveySessionId: session.id } });
      await tx.surveyResponse.createMany({
        data: Object.entries(answers).filter(([, value]) => value !== undefined).map(([questionKey, value]) => ({
          surveySessionId: session.id, questionKey, answerJson: value as Prisma.InputJsonValue,
        })),
      });
      if (answers.product !== "none") {
        const product = await tx.productConcept.findUniqueOrThrow({ where: { slug: answers.product } });
        await tx.productVote.create({ data: { productConceptId: product.id, anonymousSessionId, surveySessionId: session.id, source: "SURVEY" } });
      }
      return true;
    });
    const saved = await db.surveyResponse.findMany({ where: { session: { anonymousSessionId, surveyVersion } } });
    return { ok: true, recorded, answers: Object.fromEntries(saved.map(({ questionKey, answerJson }) => [questionKey, answerJson])) };
  },
  async "products/vote"({ slug, token, website }, headers) {
    const anonymousSessionId = await anonymousSession();
    await rateLimit(headers, "concept-vote", 25, hour);
    await verifyChallenge(token, website);
    const product = await db.productConcept.findUniqueOrThrow({ where: { slug } });
    const ballotKey = `priority:${anonymousSessionId}`;
    const previous = await db.productVote.findUnique({ where: { ballotKey }, select: { productConceptId: true } });
    if (previous?.productConceptId === product.id) return { ok: true, recorded: false };
    await db.productVote.upsert({
      where: { ballotKey },
      create: { ballotKey, productConceptId: product.id, anonymousSessionId, source: "STANDALONE" },
      update: { productConceptId: product.id },
    });
    return { ok: true, recorded: true };
  },
  async "products/feedback"({ slug, purchaseIntent, expectedPrice, feedback, purchaseBarrier, token, website }, headers) {
    const anonymousSessionId = await anonymousSession();
    await rateLimit(headers, "concept-feedback", 15, hour);
    await verifyChallenge(token, website);
    const product = await db.productConcept.findUniqueOrThrow({ where: { slug } });
    await db.productFeedback.createMany({
      skipDuplicates: true,
      data: { productConceptId: product.id, anonymousSessionId, purchaseIntent, expectedPrice, feedback, purchaseBarrier },
    });
    return { ok: true };
  },
  async "waitlist/join"({ email, firstName, marketingConsent, tracking, token, website }, headers) {
    await rateLimit(headers, "waitlist-join", 12, hour);
    await verifyChallenge(token, website);
    await rateLimit(headers, "waitlist-address", 3, hour, email);
    const mail = mailConfiguration();
    const confirmation = secretToken();
    const unsubscribe = secretToken();
    const timestamp = new Date();
    const data = {
      firstName: firstName || null, marketingConsent, consentVersion, consentTimestamp: timestamp,
      confirmationHash: hashToken(confirmation), confirmationExpiry: new Date(timestamp.getTime() + 48 * hour),
      unsubscribeHash: hashToken(unsubscribe),
    };
    const claimed = await db.$transaction(async tx => {
      const inserted = await tx.waitlistSubscriber.createMany({
        skipDuplicates: true,
        data: { ...data, email, source: tracking.source ?? "direct", campaign: tracking.campaign },
      });
      if (inserted.count) return true;
      const updated = await tx.waitlistSubscriber.updateMany({
        where: {
          email,
          OR: [{ unsubscribedAt: { not: null } }, { confirmedAt: null, consentTimestamp: { lt: new Date(timestamp.getTime() - 60_000) } }],
        },
        data: { ...data, confirmedAt: null, unsubscribedAt: null },
      });
      return updated.count > 0;
    });
    if (claimed) {
      try {
        await sendConfirmation(mail, email, confirmation, unsubscribe);
      } catch (error) {
        await db.waitlistSubscriber.updateMany({
          where: { email, confirmationHash: data.confirmationHash },
          data: { confirmationHash: null, confirmationExpiry: null, consentTimestamp: new Date(0) },
        });
        throw error;
      }
    }
    return { ok: true };
  },
  async "waitlist/confirm"({ token }, headers) {
    await rateLimit(headers, "email-confirm", 30, hour);
    const now = new Date();
    const welcomeId = await db.$transaction(async tx => {
      const [subscriber] = await tx.waitlistSubscriber.updateManyAndReturn({
        where: { confirmationHash: hashToken(token), confirmationExpiry: { gt: now }, unsubscribedAt: null },
        data: { confirmedAt: now, confirmationHash: null, confirmationExpiry: null },
        select: { id: true, marketingConsent: true, welcomeSentAt: true },
      });
      if (!subscriber) {
        throw new RequestError("This link has expired or has already been used. You can request a new link from the community page.", 404);
      }
      if (!subscriber.marketingConsent || subscriber.welcomeSentAt) return null;

      await tx.waitlistSubscriber.update({
        where: { id: subscriber.id },
        data: { welcomeQueuedAt: now, welcomeAttemptedAt: null },
      });
      return subscriber.id;
    });
    if (welcomeId) after(async () => { await deliverWaitlistWelcome(welcomeId); });
    return { ok: true };
  },
  async "waitlist/unsubscribe"({ token }, headers) {
    await rateLimit(headers, "email-unsubscribe", 30, hour);
    if (!(await unsubscribeWaitlist(token))) {
      throw new RequestError("This unsubscribe link is invalid. Please contact us for help.", 404);
    }
    return { ok: true };
  },
  async contact({ email, name, message, token, website }, headers) {
    await rateLimit(headers, "contact", 6, hour);
    await verifyChallenge(token, website);
    const { resend, from } = mailConfiguration();
    const to = process.env.CONTACT_EMAIL;
    if (!to) throw new RequestError("Contact is temporarily unavailable. Please try again later.", 503);
    const result = await resend.emails.send({ from, to, replyTo: email, subject: "bkr contact form", text: `From ${name}\n\n${message}` });
    if (result.error) throw new RequestError("Your message couldn’t be sent. Please try again.", 503);
    return { ok: true };
  },
};

export async function POST(request: Request, context: RouteContext<"/api/research/[...action]">) {
  const action = requestKeySchema.safeParse((await context.params).action.join("/"));
  if (!action.success) return Response.json({ error: "Endpoint not found." }, { status: 404 });
  try {
    assertOrigin(request);
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new RequestError("Expected a JSON request.", 415);
    if (Number(request.headers.get("content-length")) > 24000) throw new RequestError("This submission is too large.", 413);
    const body = await request.text();
    if (body.length > 24000) throw new RequestError("This submission is too large.", 413);
    const data = requestSchemas[action.data].safeParse(JSON.parse(body));
    if (!data.success) throw new RequestError("Please check the information you entered and try again.");
    // The route key selects both the validation schema and its matching handler.
    const handler = handlers[action.data] as (input: typeof data.data, headers: Headers) => Promise<object>;
    const result = await handler(data.data, request.headers);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof RequestError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return Response.json({ error: "Invalid request." }, { status: 400 });
    console.error(JSON.stringify({ event: "research_request_failed", action: action.data, code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : "unexpected" }));
    return Response.json({ error: "Something went wrong. Please try again shortly." }, { status: 503 });
  }
}
