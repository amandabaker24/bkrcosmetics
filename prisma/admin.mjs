import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { hashPassword } from "../lib/password.mjs";

const email = z.string().trim().toLowerCase().pipe(z.email()).parse(process.argv[2]);
if (process.stdin.isTTY) throw new Error("Pass the administrator password through standard input.");
let password = "";
for await (const chunk of process.stdin.setEncoding("utf8")) {
  password += chunk;
  if (password.length > 257) throw new Error("The password is too long.");
}
password = password.replace(/\r?\n$/, "");
if (password.length < 16 || password.length > 256) throw new Error("Use a password of 16–256 characters.");
const prisma = new PrismaClient();
try {
  const passwordHash = await hashPassword(password);
  await prisma.$transaction(async tx => {
    const account = await tx.adminUser.upsert({ where: { email }, update: { passwordHash }, create: { email, passwordHash } });
    await tx.adminSession.deleteMany({ where: { userId: account.id } });
  });
  console.log("Administrator saved.");
} finally {
  await prisma.$disconnect();
}
