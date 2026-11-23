import { z } from "zod";
import concepts from "./concepts.json";
import { countries } from "./countries";

export const skinTypes = ["Dry", "Oily", "Combination", "Normal", "Sensitive", "Not sure"] as const;
export const concerns = [
  "Fine lines and wrinkles", "Loss of firmness", "Sun spots and age spots", "Hyperpigmentation",
  "Uneven skin tone", "Uneven skin texture", "Dullness", "Dryness and dehydration",
  "Skin sensitivity", "Moisture barrier concerns", "Preventative skincare", "Radiance and glass skin",
  "Other", "No current concerns",
] as const;
export const priorityConcerns = [
  "Fine lines and wrinkles", "Sun spots and discoloration", "Uneven skin texture", "Loss of firmness",
  "Dryness and dehydration", "Dullness and lack of radiance", "Moisture barrier support", "Enlarged-looking pores",
] as const;
export const retinoidUse = ["Retinol", "Retinal", "Both", "Neither currently", "Not sure"] as const;
export const vitaminCUse = ["Most days", "Some days", "Not currently", "Not sure"] as const;
export const sunscreenHabits = ["Daily or nearly daily", "Several days a week", "Mainly outdoors or in strong sun", "Rarely", "Never", "Prefer not to say"] as const;
export const irritation = ["No", "Yes, occasionally", "Yes, frequently", "Not sure", "Prefer not to say"] as const;
export const performance = ["Visible changes over time", "Immediate hydration or comfort", "Comfort with regular use", "Layers well with other products", "Simple, consistent routine", "No specific expectation", "Other"] as const;
export const testingInterest = ["Yes", "Maybe, depending on the details", "No", "Prefer not to say"] as const;
export const results = ["Radiant and dewy", "Smooth and refined", "Hydrated and plump", "Balanced and comfortable", "Bright and even-looking", "Natural glow without excess shine"] as const;
export const frustrations = ["Too sticky", "Too greasy", "Doesn't absorb well", "Pills under makeup", "Causes discomfort", "Too expensive", "Too many steps", "Doesn't deliver noticeable results", "Other"] as const;
export const textures = ["Lightweight watery serum", "Milky essence", "Gel moisturizer", "Rich cream", "Facial oil", "No preference"] as const;
export const routine = ["1–2", "3–4", "5–6", "7+", "I don't have a consistent routine"] as const;
export const spending = ["Under $20", "$20–$35", "$36–$50", "$51–$75", "Over $75"] as const;
export const prices = ["Under $25", "$25–$34", "$35–$44", "$45–$59", "$60+", "I would need to try it first"] as const;
export const ingredients = ["Hyaluronic acid", "Niacinamide", "Ceramides", "Peptides", "Fragrance-free", "Retinol or retinal", "Vitamin C", "Minimalist formulations", "No specific preference", "Other"] as const;
export const ages = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55–64", "65+"] as const;
export const discoverySources = ["Search", "Instagram", "TikTok", "Friend or family", "Newsletter", "Other"] as const;
export const products = [...concepts.map(c => c.slug), "none"];

function selection<T extends readonly [string, ...string[]]>(values: T, max = values.length) {
  return z.array(z.enum(values)).min(1).max(max).refine(items => new Set(items).size === items.length);
}

export const answerSchemas = {
  skinType: z.object({ type: z.enum(skinTypes), sensitive: z.boolean() }).strict(),
  concerns: selection(concerns).refine(values => !values.includes("No current concerns") || values.length === 1),
  priorityConcern: z.enum(priorityConcerns),
  results: selection(results, 3),
  frustrations: selection(frustrations),
  irritation: z.enum(irritation),
  textures: selection(textures).refine(values => !values.includes("No preference") || values.length === 1),
  routine: z.enum(routine),
  retinoidUse: z.enum(retinoidUse),
  vitaminCUse: z.enum(vitaminCUse),
  sunscreen: z.enum(sunscreenHabits),
  repurchases: z.string().trim().max(600),
  performance: selection(performance).refine(values => !values.includes("No specific expectation") || values.length === 1),
  spending: z.enum(spending),
  price: z.enum(prices),
  ingredients: z.object({ choices: selection(ingredients).refine(values => !values.includes("No specific preference") || values.length === 1), avoid: z.string().trim().max(300).optional() }).strict(),
  feedback: z.string().trim().max(1000),
  switching: z.string().trim().max(1000),
  testingInterest: z.enum(testingInterest),
  product: z.string().refine(value => products.includes(value)),
  demographics: z.object({ age: z.enum(ages).optional(), country: z.string().refine(value => countries.includes(value)).optional(), discovery: z.enum(discoverySources).optional() }).strict().optional(),
};
export const answersSchema = z.object(answerSchemas).strict();
export type Answers = z.infer<typeof answersSchema>;
export type QuestionKey = keyof Answers;
export const questionKeys = Object.keys(answerSchemas) as QuestionKey[];
export const surveyVersion = "discovery-2";
export const consentVersion = "founding-2";
export const marketingWording = "I agree to receive marketing emails from bkr. I can unsubscribe at any time.";

export const questions: Record<QuestionKey, {title: string; hint: string; options?: readonly string[]; multiple?: boolean; max?: number; exclusive?: string}> = {
  skinType: { title: "What best describes your skin?", hint: "Choose one. You can also indicate if your skin is sensitive.", options: skinTypes },
  concerns: { title: "Which skincare concerns matter to you right now?", hint: "Select all that apply.", options: concerns, multiple: true, exclusive: "No current concerns" },
  priorityConcern: { title: "If you could improve one thing about your skin, what would it be?", hint: "Help us understand what matters most to you.", options: priorityConcerns },
  results: { title: "What does your ideal skin look and feel like?", hint: "Select up to three.", options: results, multiple: true, max: 3 },
  frustrations: { title: "What frustrates you most about skincare products?", hint: "Select all that apply.", options: frustrations, multiple: true },
  irritation: { title: "Have you experienced irritation from skincare products?", hint: "Think about your own experience. Choose one.", options: irritation },
  textures: { title: "Which skincare textures do you enjoy most?", hint: "Select all that apply.", options: textures, multiple: true, exclusive: "No preference" },
  routine: { title: "How many skincare products do you typically use in your daily routine?", hint: "Choose one.", options: routine },
  retinoidUse: { title: "Do you currently use retinol or retinal?", hint: "Choose one.", options: retinoidUse },
  vitaminCUse: { title: "How often do you currently use skincare with vitamin C?", hint: "Choose one.", options: vitaminCUse },
  sunscreen: { title: "Which best describes how often you wear sunscreen?", hint: "Choose one.", options: sunscreenHabits },
  repurchases: { title: "Which skincare products do you buy again?", hint: "Optional. Product types or names are both fine." },
  performance: { title: "What do you expect from a skincare product you keep using?", hint: "Select all that apply.", options: performance, multiple: true, exclusive: "No specific expectation" },
  spending: { title: "How much do you typically spend on a single skincare product?", hint: "Choose one amount in USD.", options: spending },
  price: { title: "What is the maximum you would realistically consider paying for a 50 mL product?", hint: "Think about a product you would consider adding to your routine. Choose one amount in USD.", options: prices },
  ingredients: { title: "Are there ingredients or product characteristics you actively look for?", hint: "Select all that apply.", options: ingredients, multiple: true, exclusive: "No specific preference" },
  product: { title: "Which concept, if any, would you most like bkr to develop first?", hint: "Choose one concept, or select None of these.", options: products },
  feedback: { title: "What are your current skincare products missing, if anything?", hint: "Optional. Please leave out names, contact details, and medical information." },
  switching: { title: "What, if anything, would convince you to switch to a new skincare brand?", hint: "Optional. Please leave out names, contact details, and medical information." },
  testingInterest: { title: "Would you be interested in participating in future product testing?", hint: "This answer helps us gauge interest. Choose one.", options: testingInterest },
  demographics: { title: "Would you like to tell us a little more about yourself?", hint: "Every field is optional." },
};
