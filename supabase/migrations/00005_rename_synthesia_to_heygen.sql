-- ============================================================
-- Audit fix: rename synthesia columns to heygen, drop unused columns
-- ============================================================

ALTER TABLE public.creators RENAME COLUMN synthesia_avatar_id TO heygen_avatar_id;
ALTER TABLE public.shorts DROP COLUMN IF EXISTS synthesia_video_url;
ALTER TABLE public.shorts DROP COLUMN IF EXISTS final_mp4_url;
