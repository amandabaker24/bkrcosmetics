import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import { PrismaClient } from "@prisma/client";

if (existsSync(".env")) loadEnvFile();

const prisma = new PrismaClient();

try {
  const concepts = JSON.parse(await readFile(new URL("../lib/concepts.json", import.meta.url), "utf8"));
  for (const concept of concepts) {
    const { name, slug, description, imageUrl, proposedPrice, status } = concept;
    const data = { name, slug, description, imageUrl, proposedPrice, status };
    await prisma.productConcept.upsert({ where: { slug }, create: data, update: data });
  }
} finally {
  await prisma.$disconnect();
}
