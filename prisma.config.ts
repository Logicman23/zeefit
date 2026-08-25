import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 moved connection details out of schema.prisma and stopped loading
 * .env automatically — hence the dotenv import above, which must come first.
 *
 * `datasource.url` here is used by the CLI only (migrate, db pull, studio), so
 * it points at Supabase's DIRECT connection on port 5432. PgBouncer's
 * transaction pooling mode cannot run DDL or advisory locks, which is exactly
 * what migrations need.
 *
 * The application's own connection is separate: src/lib/prisma.ts builds a
 * driver adapter over the POOLED url (port 6543), which is what serverless
 * functions should use.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
