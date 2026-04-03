-- ============================================================
-- Sprint C: Add Mux columns to shorts table
-- ============================================================

ALTER TABLE public.shorts
  ADD COLUMN mux_asset_id TEXT,
  ADD COLUMN mux_playback_id TEXT;
