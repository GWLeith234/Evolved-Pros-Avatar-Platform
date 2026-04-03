-- ============================================================
-- Sprint D: Add system_prompt to creators table
-- ============================================================

ALTER TABLE public.creators
  ADD COLUMN system_prompt TEXT NOT NULL
  DEFAULT 'conversational, direct, authority without arrogance. Short punchy sentences. No fluff. Speaks to business owners and sales professionals.';
