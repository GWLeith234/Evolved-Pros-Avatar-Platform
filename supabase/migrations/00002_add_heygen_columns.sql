-- ============================================================
-- Sprint B: Add HeyGen columns to shorts table
-- ============================================================

ALTER TABLE public.shorts
  ADD COLUMN heygen_video_id TEXT,
  ADD COLUMN heygen_video_url TEXT;
