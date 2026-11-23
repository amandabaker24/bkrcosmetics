import { z } from "zod";
import { answerSchemas } from "./survey";

export const legacyProducts = {
  "silk-glass-essence": "The Silk Glass Essence",
  "texture-refining-serum": "The Texture Refining Serum",
  "glass-veil-gel-cream": "The Glass Veil Gel Cream",
} as const;

export const legacyAnswersSchema = z.object({
  skinType: answerSchemas.skinType,
  concerns: z.array(z.enum(["Dullness", "Uneven texture", "Dryness", "Visible pores", "Dark spots", "Fine lines", "Excess oiliness", "Redness", "Other"])).min(1),
  results: answerSchemas.results,
  frustrations: answerSchemas.frustrations,
  textures: answerSchemas.textures,
  routine: answerSchemas.routine,
  spending: answerSchemas.spending,
  price: answerSchemas.price,
  ingredients: answerSchemas.ingredients,
  product: z.enum(["silk-glass-essence", "texture-refining-serum", "glass-veil-gel-cream", "none"]),
  feedback: answerSchemas.feedback.optional(),
  demographics: answerSchemas.demographics,
}).strict();
