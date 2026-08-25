import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

/**
 * Prisma 7 requires a driver adapter — the old "url in schema.prisma" path is
 * gone. This connects over Supabase's TRANSACTION POOLER (port 6543), which is
 * the right target for serverless: PgBouncer multiplexes many short-lived
 * function invocations onto a small set of real Postgres connections.
 *
 * Migrations deliberately do NOT come through here; they use the direct
 * connection configured in prisma.config.ts, because transaction-mode pooling
 * cannot hold the advisory locks that DDL requires.
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaPg({
    connectionString,
    // One connection per invocation. The pooler, not the app, does the pooling.
    max: 1,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * Single client per process. Next's dev server re-evaluates modules on every HMR
 * pass, so without the global cache each save would open a fresh pool and
 * exhaust Supabase's connection limit within a handful of edits.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createPrismaClient();
  return globalForPrisma.prisma;
}

/**
 * Constructed on FIRST USE, not on import.
 *
 * `next build` imports every route module to collect page data, so an eagerly
 * constructed client turns DATABASE_URL into a build-time secret — and the
 * deploy fails before it ever serves a request. Behind this proxy the build
 * needs no database credentials at all; a missing DATABASE_URL surfaces on the
 * first query instead, which is where the problem actually is.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property) as unknown;
    // Bind methods to the real client — an unbound $transaction/$connect would
    // lose `this` and fail at runtime.
    return typeof value === "function" ? value.bind(client) : value;
  },
});
