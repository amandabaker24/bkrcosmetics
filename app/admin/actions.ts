"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminSession, revokeAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { emailSchema } from "@/lib/requests";
import { rateLimit, RequestError } from "@/lib/security";
import { verifyPassword } from "@/lib/password.mjs";

const credentials = z.object({ email: emailSchema, password: z.string().min(1).max(256) });
const invalidHash = `${"0".repeat(48)}:${"0".repeat(128)}`;

export async function signIn(_: string, form: FormData) {
  const input = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!input.success) return "Check your email and password.";
  try {
    const { email, password } = input.data;
    const incoming = await headers();
    await rateLimit(incoming, "admin-sign-in", 15, 900000);
    await rateLimit(incoming, "admin-account", 12, 900000, email);
    const user = await db.adminUser.findUnique({ where: { email } });
    if (!(await verifyPassword(password, user?.passwordHash ?? invalidHash)) || user?.role !== "ADMIN") {
      return "Check your email and password.";
    }
    await createAdminSession(user.id);
  } catch (error) {
    if (error instanceof RequestError) return error.message;
    console.error(JSON.stringify({ event: "admin_sign_in_failed" }));
    return "Sign-in is temporarily unavailable.";
  }
  redirect("/admin");
}

export async function signOut() {
  await revokeAdminSession();
  redirect("/admin/login");
}
