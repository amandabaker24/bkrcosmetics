import { welcomeUnsubscribeTokenSchema } from "@/lib/waitlist-tokens";
import { unsubscribeWaitlist } from "@/lib/waitlist-unsubscribe";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const token = welcomeUnsubscribeTokenSchema.safeParse(new URL(request.url).searchParams.get("token"));
  if (!token.success) return new Response(null, { status: 400, headers });
  if (Number(request.headers.get("content-length")) > 4096) return new Response(null, { status: 413, headers });

  // Mailbox providers submit this signed link directly, without a site session.
  const form = await request.formData().catch(() => null);
  if (form?.get("List-Unsubscribe") !== "One-Click") return new Response(null, { status: 400, headers });

  try {
    return new Response(null, { status: (await unsubscribeWaitlist(token.data)) ? 204 : 404, headers });
  } catch {
    console.error(JSON.stringify({ event: "waitlist_one_click_unsubscribe_failed" }));
    return new Response(null, { status: 503, headers });
  }
}
