export async function submitResearch<T extends object = { ok: boolean }>(action: string, data: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/research/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("We couldn’t connect. Please check your connection and try again.");
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
  return result as T;
}

export const submitError = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";
