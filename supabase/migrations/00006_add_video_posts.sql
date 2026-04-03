-- ============================================================
-- Sprint F: Add video post columns to shorts table
-- ============================================================

ALTER TABLE public.shorts
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'episode_short',
  ADD COLUMN IF NOT EXISTS post_title TEXT,
  ADD COLUMN IF NOT EXISTS post_bullets TEXT;

-- Make episode_id nullable for video posts that don't need an episode
ALTER TABLE public.shorts ALTER COLUMN episode_id DROP NOT NULL;

UPDATE public.shorts
  SET post_type = 'episode_short'
  WHERE post_type IS NULL;
