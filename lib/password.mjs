import { randomBytes, scrypt as derive, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(derive);

export async function hashPassword(password) {
  const salt = randomBytes(24).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password, saved) {
  const [salt, expected] = saved.split(":");
  if (!salt || !expected) return false;
  const hash = await scrypt(password, salt, 64);
  const buffer = Buffer.from(expected, "hex");
  return buffer.length === hash.length && timingSafeEqual(hash, buffer);
}
