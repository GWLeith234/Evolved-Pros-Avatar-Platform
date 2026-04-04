-- ============================================================
-- Sprint H-1: Add tier column to users table
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'community';
