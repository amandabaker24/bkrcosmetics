import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/unsubscribe", "/community/confirm"] }, sitemap: process.env.APP_URL ? new URL("/sitemap.xml", process.env.APP_URL).href : undefined };
}
