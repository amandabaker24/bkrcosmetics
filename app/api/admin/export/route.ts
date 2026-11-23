import { getAdmin } from "@/lib/admin-auth";
import { filtersSchema, surveyCsv } from "@/lib/reporting";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!(await getAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  const filters = filtersSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!filters.success) return Response.json({ error: "Invalid filters" }, { status: 400, headers });
  return new Response(await surveyCsv(filters.data), {
    headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="bkr-surveys.csv"' },
  });
}
