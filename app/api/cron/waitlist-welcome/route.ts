import { safeEqual } from "@/lib/security";
import { retryWaitlistWelcomes } from "@/lib/waitlist-welcome";

export const maxDuration = 60;

export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization || !safeEqual(Buffer.from(authorization), Buffer.from(`Bearer ${secret}`))) {
    return new Response(null, { status: 401, headers });
  }

  try {
    return Response.json(await retryWaitlistWelcomes(), { headers });
  } catch {
    console.error(JSON.stringify({ event: "waitlist_welcome_retry_failed" }));
    return new Response(null, { status: 503, headers });
  }
}
