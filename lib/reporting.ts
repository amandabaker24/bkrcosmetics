import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import { ages, answerSchemas, concerns, ingredients, prices, priorityConcerns, products, skinTypes, surveyVersion } from "./survey";
import concepts from "./concepts.json";
import { legacyAnswersSchema, legacyProducts } from "./survey-legacy";

export const reportProducts = [...products.filter(product => product !== "none"), ...Object.keys(legacyProducts), "none"];
export const reportVersions = ["discovery-1", surveyVersion] as const;
export const reportPriorityConcerns = [...new Set([...priorityConcerns, ...concerns])];
const storedRenewalAnswersSchema = z.object({
  ...answerSchemas, priorityConcern: z.enum(reportPriorityConcerns),
}).strict();
type StoredRenewalAnswers = z.infer<typeof storedRenewalAnswersSchema>;
type StoredAnswers = StoredRenewalAnswers | z.infer<typeof legacyAnswersSchema>;

const day = 86400000;
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(value => value === "" ? undefined : value, schema.optional());
export const filtersSchema = z.object({
  from: optional(z.iso.date()),
  to: optional(z.iso.date()),
  age: optional(z.enum(ages)),
  skin: optional(z.enum(skinTypes)),
  product: optional(z.string().refine(value => reportProducts.includes(value))),
  version: optional(z.enum(reportVersions)),
  concern: optional(z.enum(reportPriorityConcerns)),
  ingredient: optional(z.enum(ingredients)),
  price: optional(z.enum(prices)),
  source: optional(z.string().regex(/^[a-z0-9_-]{1,45}$/i)),
  q: optional(z.string().trim().max(200)),
  theme: optional(z.enum(["Greasy texture", "Hydration", "Sensitivity", "Product pilling", "Price", "Radiance"])),
  page: optional(z.coerce.number().int().min(1).max(10000)),
}).refine(values => !values.from || !values.to || values.from <= values.to, { message: "The end date must follow the start date." });

export type Filters = z.infer<typeof filtersSchema>;

export const productLabel = (slug: string) => concepts.find(concept => concept.slug === slug)?.name
  ?? legacyProducts[slug as keyof typeof legacyProducts]
  ?? "None of these";

export const themes = [
  ["Greasy texture", /greas|oiliness|oily|slick/i],
  ["Hydration", /hydrat|moisturi|dryness|\bdry\b|plump/i],
  ["Sensitivity", /sensitiv|irritat|sting|redness|fragrance/i],
  ["Product pilling", /pill(?:s|ing)?\b|ball(?:s|ing)? up/i],
  ["Price", /price|cost|expens|afford|budget/i],
  ["Radiance", /radian|glow|dull|luminous|dewy/i],
] as const;

export type Count = { name: string; count: number };
const rank = (entries: readonly string[][]): Count[] => {
  const counts = new Map<string, number>();
  for (const items of entries) for (const key of new Set(items)) counts.set(key, (counts.get(key) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

function overTime(dates: Date[]): Count[] {
  if (!dates.length) return [];
  const bounds = dates.reduce(([min, max], date) => [Math.min(min, +date), Math.max(max, +date)], [Infinity, -Infinity]);
  const monthly = (bounds[1] - bounds[0]) / day > 70;
  const frequency = new Map<string, number>();
  for (const date of dates) {
    const name = date.toISOString().slice(0, monthly ? 7 : 10);
    frequency.set(name, (frequency.get(name) ?? 0) + 1);
  }
  const result: Count[] = [];
  const start = new Date(bounds[0]);
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), monthly ? 1 : start.getUTCDate()));
  for (; +cursor <= bounds[1]; monthly ? cursor.setUTCMonth(cursor.getUTCMonth() + 1) : cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const name = cursor.toISOString().slice(0, monthly ? 7 : 10);
    result.push({ name, count: frequency.get(name) ?? 0 });
  }
  return result;
}

const contains = (key: string, value: Prisma.InputJsonValue, path?: string[]): Prisma.SurveySessionWhereInput => ({
  responses: { some: { questionKey: key, answerJson: { equals: value, ...(path ? { path } : {}) } } },
});

export function reportQueries(filters: Filters) {
  const date = {
    ...(filters.from ? { gte: new Date(filters.from) } : {}),
    ...(filters.to ? { lt: new Date(+new Date(filters.to) + day) } : {}),
  };
  const facets: Prisma.SurveySessionWhereInput[] = [];
  if (filters.age) facets.push(contains("demographics", filters.age, ["age"]));
  if (filters.skin) facets.push(filters.skin === "Sensitive" ? { OR: [contains("skinType", "Sensitive", ["type"]), contains("skinType", true, ["sensitive"])] } : contains("skinType", filters.skin, ["type"]));
  if (filters.product) facets.push(contains("product", filters.product));
  if (filters.price) facets.push(contains("price", filters.price));
  if (filters.concern) facets.push(contains("priorityConcern", filters.concern));
  if (filters.ingredient) facets.push({
    responses: { some: { questionKey: "ingredients", answerJson: { path: ["choices"], array_contains: [filters.ingredient] } } },
  });
  const survey: Prisma.SurveySessionWhereInput = { startedAt: date, source: filters.source, surveyVersion: filters.version, AND: facets };
  return { survey, date };
}

export async function completedSurveys(where: Prisma.SurveySessionWhereInput) {
  const data = await db.surveySession.findMany({
    where: { ...where, status: "COMPLETED" },
    orderBy: [{ completedAt: "desc" }, { id: "asc" }],
    select: { completedAt: true, source: true, campaign: true, surveyVersion: true, responses: { select: { questionKey: true, answerJson: true } } },
  });
  return data.flatMap<{ completedAt: Date; source: string; campaign: string | null; surveyVersion: string; answers: StoredAnswers }>(row => {
    const { responses, completedAt, ...record } = row;
    const schema = record.surveyVersion === "discovery-1" ? legacyAnswersSchema : storedRenewalAnswersSchema;
    const answers = schema.safeParse(Object.fromEntries(responses.map(({ questionKey, answerJson }) => [questionKey, answerJson])));
    return completedAt && answers.success ? [{ ...record, completedAt, answers: answers.data }] : [];
  });
}

export function matchesText(text: string, filters: Filters) {
  const selectedTheme = themes.find(([name]) => name === filters.theme)?.[1];
  return (!filters.q || text.toLowerCase().includes(filters.q.toLowerCase())) && (!selectedTheme || selectedTheme.test(text));
}

function insightRows(records: { answers: StoredAnswers }[]) {
  return skinTypes.filter(type => type !== "Not sure").flatMap(type => {
    const group = records.filter(({ answers }) => answers.skinType.type === type || (type === "Sensitive" && answers.skinType.sensitive));
    if (!group.length) return [];
    const top = rank(group.map(({ answers }) => answers.textures))[0];
    return [{ type, sample: group.length, texture: top.name, count: top.count }];
  });
}

function conceptSegments(records: { answers: StoredAnswers }[], productFilter?: string) {
  const activeAnswers = records.flatMap(({ answers }) => "priorityConcern" in answers ? [answers] : []);
  const groups = new Map<string, { age: string; concern: string; answers: StoredRenewalAnswers[] }>();
  for (const answers of activeAnswers) {
    const age = answers.demographics?.age;
    if (!age) continue;
    const key = JSON.stringify([age, answers.priorityConcern]);
    const group = groups.get(key) ?? { age, concern: answers.priorityConcern, answers: [] };
    group.answers.push(answers);
    groups.set(key, group);
  }

  return concepts.filter(concept => !productFilter || concept.slug === productFilter).map(concept => {
    const voters = activeAnswers.filter(answers => answers.product === concept.slug);
    const segments = [...groups.values()].flatMap(({ age, concern, answers }) => {
      const supporters = answers.filter(answer => answer.product === concept.slug);
      if (!supporters.length) return [];
      return [{
        age, concern, sample: answers.length, votes: supporters.length,
        ingredients: rank(supporters.map(answer => answer.ingredients.choices)),
        prices: rank(supporters.map(answer => [answer.price])),
      }];
    }).sort((a, b) =>
      Number(b.sample >= 5) - Number(a.sample >= 5)
      || b.votes / b.sample - a.votes / a.sample
      || b.votes - a.votes
      || a.age.localeCompare(b.age)
      || a.concern.localeCompare(b.concern));
    return {
      slug: concept.slug,
      name: concept.name,
      votes: voters.length,
      segments,
      ingredients: rank(voters.map(answers => answers.ingredients.choices)),
      prices: rank(voters.map(answers => [answers.price])),
    };
  });
}

function writtenResponses(answers: StoredAnswers) {
  return "priorityConcern" in answers
    ? [
      { question: "What’s missing", text: answers.feedback },
      { question: "Switching brands", text: answers.switching },
      { question: "Products repurchased", text: answers.repurchases },
    ]
    : [{ question: "Ideal skincare product", text: answers.feedback ?? "" }];
}

export async function analytics(filters: Filters) {
  const { date, survey } = reportQueries(filters);
  const [started, records, waitlist, standalone, standaloneFeedback, sources, unfilteredProducts] = await Promise.all([
    db.surveySession.count({ where: survey }),
    completedSurveys(survey),
    db.waitlistSubscriber.findMany({
      where: { createdAt: date, source: filters.source },
      select: { createdAt: true, marketingConsent: true, consentTimestamp: true, confirmedAt: true, unsubscribedAt: true },
    }),
    db.productVote.findMany({
      where: { createdAt: date, source: "STANDALONE" },
      select: { ballotKey: true, concept: { select: { name: true } } },
    }),
    db.productFeedback.findMany({
      where: { createdAt: date },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, expectedPrice: true, purchaseIntent: true, feedback: true, purchaseBarrier: true, concept: { select: { name: true } } },
    }),
    db.surveySession.findMany({ distinct: ["source"], select: { source: true }, orderBy: { source: "asc" } }),
    filters.product ? completedSurveys(reportQueries({ ...filters, product: undefined }).survey) : undefined,
  ]);
  const verifiedSignups = waitlist.filter(row => row.confirmedAt);
  const activeSignups = verifiedSignups.filter(row => !row.unsubscribedAt);
  const pendingSignups = waitlist.filter(row => !row.confirmedAt && !row.unsubscribedAt && +row.consentTimestamp > 0);
  const optedIn = activeSignups.filter(row => row.marketingConsent).length;
  const surveyVotes = rank(records.filter(row => row.surveyVersion === surveyVersion && row.answers.product !== "none").map(row => [productLabel(row.answers.product)]));
  const historicalSurveyVotes = rank(records.filter(row => row.surveyVersion !== surveyVersion && row.answers.product !== "none").map(row => [productLabel(row.answers.product)]));
  const priceCounts = new Map(rank(records.map(row => [row.answers.price])).map(item => [item.name, item.count]));
  const feedback = records.flatMap(row => writtenResponses(row.answers)
    .filter(({ text }) => text && matchesText(text, filters))
    .map(({ question, text }) => ({
      date: row.completedAt.toISOString().slice(0, 10),
      question, text,
      themes: themes.filter(([, pattern]) => pattern.test(text)).map(([theme]) => theme),
    })));
  const page = Math.min(filters.page ?? 1, Math.max(1, Math.ceil(feedback.length / 25)));
  return {
    started, completed: records.length, subscribers: activeSignups.length,
    pending: pendingSignups.length, optedIn,
    concerns: rank(records.map(row => row.answers.concerns)),
    textures: rank(records.map(row => row.answers.textures)),
    skin: rank(records.map(({ answers }) => answers.skinType.sensitive && answers.skinType.type !== "Sensitive"
      ? [answers.skinType.type, "Sensitive"] : [answers.skinType.type])),
    surveyVotes,
    historicalSurveyVotes,
    standaloneVotes: rank(standalone.filter(row => row.ballotKey !== null).map(row => [row.concept.name])),
    historicalStandaloneVotes: rank(standalone.filter(row => row.ballotKey === null).map(row => [row.concept.name])),
    primaryConcerns: rank(records.flatMap(({ answers }) => "priorityConcern" in answers ? [[answers.priorityConcern]] : [])),
    segments: conceptSegments(unfilteredProducts ?? records, filters.product),
    testingInterest: rank(records.flatMap(({ answers }) => "testingInterest" in answers ? [[answers.testingInterest]] : [])),
    prices: prices.map(name => ({ name, count: priceCounts.get(name) ?? 0 })),
    surveyTimeline: overTime(records.map(row => row.completedAt)),
    waitlistTimeline: overTime(verifiedSignups.map(row => row.createdAt)),
    insights: insightRows(records),
    feedback: feedback.slice((page - 1) * 25, page * 25),
    feedbackCount: feedback.length,
    feedbackPage: page,
    standaloneFeedback: standaloneFeedback.slice(0, 25).map(row => ({
      date: row.createdAt.toISOString().slice(0, 10), product: row.concept.name, intent: row.purchaseIntent,
      expectedPrice: row.expectedPrice?.toNumber(), appeal: row.feedback, barrier: row.purchaseBarrier,
    })),
    standaloneFeedbackCount: standaloneFeedback.length,
    sources: sources.map(row => row.source),
  };
}

function csvCell(input: string) {
  const value = /^[\s\p{Cf}]*[=+\-@\t\r\n]/u.test(input) ? `'${input}` : input;
  return `"${value.replaceAll('"', '""')}"`;
}

export async function surveyCsv(filters: Filters) {
  const records = await completedSurveys(reportQueries(filters).survey);
  const header = ["Completed date (UTC)", "Survey version", "Source", "Skin type", "Sensitive", "Concerns", "Desired results", "Frustrations", "Textures", "Routine size", "Typical spend", "Willingness to pay", "Ingredient preferences", "Product choice", "Age range", "Discovery channel", "Primary concern", "Retinol or retinal use", "Vitamin C use", "Sunscreen habits", "Irritation experience", "Expected performance", "Future testing interest"];
  const lines = records.filter(row => (!filters.q && !filters.theme) || writtenResponses(row.answers).some(({ text }) => text && matchesText(text, filters))).map(({ completedAt, source, surveyVersion, answers }) => [
    completedAt.toISOString().slice(0, 10), surveyVersion, source, answers.skinType.type,
    answers.skinType.sensitive || answers.skinType.type === "Sensitive" ? "Yes" : "No",
    answers.concerns.join(" | "), answers.results.join(" | "), answers.frustrations.join(" | "), answers.textures.join(" | "),
    answers.routine, answers.spending, answers.price, answers.ingredients.choices.join(" | "), productLabel(answers.product),
    answers.demographics?.age ?? "", answers.demographics?.discovery ?? "",
    ...("priorityConcern" in answers ? [
      answers.priorityConcern, answers.retinoidUse, answers.vitaminCUse, answers.sunscreen,
      answers.irritation, answers.performance.join(" | "), answers.testingInterest,
    ] : Array<string>(7).fill("")),
  ]);
  return [header, ...lines].map(line => line.map(csvCell).join(",")).join("\r\n");
}
