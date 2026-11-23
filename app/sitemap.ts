import type { MetadataRoute } from "next";
import concepts from "@/lib/concepts.json";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!process.env.APP_URL) return [];
  return ["", "/about", "/skin-discovery", "/product-lab", "/community", "/our-process", "/contact", "/privacy", "/terms", ...concepts.map(concept => `/product-lab/${concept.slug}`)]
    .map(path => ({ url: new URL(path || "/", process.env.APP_URL).href }));
}
