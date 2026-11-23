import { getAdmin } from "@/lib/admin-auth";
import { analytics, filtersSchema } from "@/lib/reporting";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!(await getAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  const filters = filtersSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!filters.success) return Response.json({ error: "Invalid filters" }, { status: 400, headers });
  return Response.json(await analytics(filters.data), { headers });
}
