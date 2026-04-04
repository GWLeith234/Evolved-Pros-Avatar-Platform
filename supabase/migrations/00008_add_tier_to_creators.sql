-- ============================================================
-- Sprint H-1: Add tier column to creators, fix habits FKs
-- ============================================================

-- Add tier to creators (the 'users' table in this platform)
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'community';
