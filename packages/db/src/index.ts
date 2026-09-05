import { DATABASE_URL } from "@repo/backend-common/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Use centralized DATABASE_URL
const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

// Singleton Prisma Client pattern to avoid connection pool exhaustion in development/monorepos
declare global {
  var __prismaClient: PrismaClient | undefined;
}

export const prismaClient: PrismaClient =
  globalThis.__prismaClient ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient = prismaClient;
}

export * from "@prisma/client";
