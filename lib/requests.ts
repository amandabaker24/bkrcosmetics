import { z } from "zod";
import { answerSchemas, answersSchema, questionKeys } from "./survey";
import concepts from "./concepts.json";

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());
const tracking = z.object({
  source: z.string().trim().max(45).regex(/^[a-z0-9_-]+$/i).optional(),
  campaign: z.string().trim().max(65).regex(/^[a-z0-9_-]+$/i).optional(),
}).strict();
export type Tracking = z.infer<typeof tracking>;
const challenge = { token: z.string().max(2048).optional(), website: z.string().max(200).optional() };
const slug = z.string().refine(value => concepts.some(concept => concept.slug === value));
const token = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const expectedPrice = z.number().min(0).max(2000).multipleOf(.01).optional();
export const purchaseIntents = ["Yes", "Maybe", "No"] as const;

export const requestSchemas = {
  "survey/start": z.object({ tracking, ...challenge }).strict(),
  "survey/progress": z.object({
    key: z.enum(questionKeys),
    answer: z.unknown(),
  }).strict().refine(value => answerSchemas[value.key].safeParse(value.answer).success),
  "survey/complete": z.object({ answers: answersSchema }).strict(),
  "products/vote": z.object({ slug, ...challenge }).strict(),
  "products/feedback": z.object({
    slug, purchaseIntent: z.enum(purchaseIntents), expectedPrice,
    feedback: z.string().trim().max(1000), purchaseBarrier: z.string().trim().max(500), ...challenge,
  }).strict(),
  "waitlist/join": z.object({
    email: emailSchema, firstName: z.string().trim().max(80).optional(), marketingConsent: z.boolean(),
    tracking, ...challenge,
  }).strict(),
  "waitlist/confirm": z.object({ token }).strict(),
  "waitlist/unsubscribe": z.object({ token }).strict(),
  "contact": z.object({
    email: emailSchema, name: z.string().trim().min(1).max(80), message: z.string().trim().min(5).max(2000), ...challenge,
  }).strict(),
} as const;

export const requestKeySchema = z.enum(Object.keys(requestSchemas) as (keyof typeof requestSchemas)[]);

export function browserTracking(): Tracking {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const get = (name: string, max: number) => {
    const value = params.get(name)?.toLowerCase();
    return value && value.length <= max && /^[a-z0-9_-]+$/.test(value) ? value : undefined;
  };
  const source = get("utm_source", 45);
  const campaign = get("utm_campaign", 65);
  const referrer = document.referrer ? new URL(document.referrer) : undefined;
  const external = referrer && referrer.origin !== window.location.origin;
  if (source || campaign || external) {
    const tracking = { source: source ?? (external ? "referral" : "direct"), campaign };
    try { sessionStorage.setItem("ml-attribution", JSON.stringify(tracking)); } catch {}
    return tracking;
  }
  try {
    const stored = sessionStorage.getItem("ml-attribution");
    if (stored) return tracking.safeParse(JSON.parse(stored)).data ?? {};
  } catch {}
  return {};
}
