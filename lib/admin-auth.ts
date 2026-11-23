import "server-only";
import { cookies } from "next/headers";
import { db } from "./db";
import { cookieOptions, hashToken, secretToken } from "./security";

const cookieName = "ml_admin";
const duration = 8 * 60 * 60;

export async function getAdmin() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const session = await db.adminSession.findUnique({
    where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
    select: { user: { select: { id: true, role: true } } },
  });
  return session?.user.role === "ADMIN" ? session.user : null;
}

export async function createAdminSession(userId: string) {
  const jar = await cookies();
  const previous = jar.get(cookieName)?.value;
  const token = secretToken();
  await db.$transaction([
    db.adminSession.deleteMany({ where: { OR: [{ expiresAt: { lte: new Date() } }, ...(previous ? [{ tokenHash: hashToken(previous) }] : [])] } }),
    db.adminSession.create({ data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + duration * 1000) } }),
  ]);
  jar.set(cookieName, token, { ...cookieOptions, sameSite: "strict", maxAge: duration });
}

export async function revokeAdminSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.set(cookieName, "", { ...cookieOptions, sameSite: "strict", maxAge: 0 });
}
