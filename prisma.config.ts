import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 moved connection details out of schema.prisma and stopped loading
 * .env automatically — hence the dotenv import above, which must come first.
 *
 * `datasource.url` here is used by the CLI only (migrate, db pull, studio), so
 * it points at Supabase's DIRECT connection on port 5432. PgBouncer's
 * transaction pooling mode cannot run DDL or hold the advisory locks that
 * migrations need.
 *
 * The application's own connection is separate: src/lib/prisma.ts builds a
 * driver adapter over the POOLED url (port 6543), which is what serverless
 * functions should use.
 */
const directUrl = process.env.DIRECT_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",

  /**
   * Declared only when the URL is actually present.
   *
   * `prisma generate` loads this file but needs no database, and it runs during
   * `postinstall` on every deploy — where migration credentials are deliberately
   * absent. The `env()` helper THROWS on a missing variable at config-load time,
   * which failed the Vercel build inside npm install, before Next ever compiled.
   * Spreading the key in conditionally keeps generate working everywhere and
   * defers the complaint to the migrate commands that genuinely need it.
   */
  ...(directUrl ? { datasource: { url: directUrl } } : {}),

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
