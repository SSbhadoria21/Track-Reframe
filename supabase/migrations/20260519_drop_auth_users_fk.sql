-- ══════════════════════════════════════════════════
-- Drop auth.users FK from users table
-- Reason: App uses NextAuth (not Supabase Auth), so
-- there are no auth.users rows to satisfy the FK.
-- Without this, every Google sign-in INSERT fails.
-- ══════════════════════════════════════════════════

-- Find and drop the foreign key constraint on users.id → auth.users.id
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Verify it's gone (run SELECT to confirm)
-- SELECT conname FROM pg_constraint WHERE conrelid = 'users'::regclass;
