-- The on_auth_user_created trigger inserts (id, email, full_name, role) only,
-- so profiles.updated_at needs a database-level default; without one every
-- trigger-created staff row fails its NOT NULL constraint.
--
-- The column already carries this default in the live database, so this
-- migration is recorded as applied rather than run (prisma migrate resolve).
ALTER TABLE "profiles" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
