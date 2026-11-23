import { z } from "zod";

export const welcomeUnsubscribeTokenSchema = z.string().regex(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.[A-Za-z0-9_-]{43}$/);
export const unsubscribeTokenSchema = z.union([welcomeUnsubscribeTokenSchema, z.string().regex(/^[A-Za-z0-9_-]{43}$/)]);
