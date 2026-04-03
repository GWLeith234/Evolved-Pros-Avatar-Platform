-- ============================================================
-- Evolved Pros AI Avatar Platform – Sprint A Foundation Schema
-- ============================================================

-- 1. Custom enum for short status
CREATE TYPE public.short_status AS ENUM (
  'draft',
  'queued',
  'voice_rendering',
  'avatar_generating',
  'compositing',
  'done',
  'error'
);

-- 2. Creators table
CREATE TABLE public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  show_name TEXT,
  elevenlabs_voice_id TEXT,
  synthesia_avatar_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Episodes table
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  podcast_name TEXT,
  published_at TIMESTAMPTZ,
  transcript_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Shorts table
CREATE TABLE public.shorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  script_text TEXT,
  status public.short_status NOT NULL DEFAULT 'draft',
  elevenlabs_audio_url TEXT,
  synthesia_video_url TEXT,
  final_mp4_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Indexes
CREATE INDEX idx_episodes_creator ON public.episodes(creator_id);
CREATE INDEX idx_shorts_creator ON public.shorts(creator_id);
CREATE INDEX idx_shorts_episode ON public.shorts(episode_id);
CREATE INDEX idx_shorts_status ON public.shorts(status);

-- ============================================================
-- 6. Row-Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;

-- Creators: users can only access their own row (id = auth.uid())
CREATE POLICY "creators_select_own" ON public.creators
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "creators_insert_own" ON public.creators
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "creators_update_own" ON public.creators
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "creators_delete_own" ON public.creators
  FOR DELETE USING (id = auth.uid());

-- Episodes: users can only access episodes where creator_id = auth.uid()
CREATE POLICY "episodes_select_own" ON public.episodes
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "episodes_insert_own" ON public.episodes
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "episodes_update_own" ON public.episodes
  FOR UPDATE USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE POLICY "episodes_delete_own" ON public.episodes
  FOR DELETE USING (creator_id = auth.uid());

-- Shorts: users can only access shorts where creator_id = auth.uid()
CREATE POLICY "shorts_select_own" ON public.shorts
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "shorts_insert_own" ON public.shorts
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "shorts_update_own" ON public.shorts
  FOR UPDATE USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE POLICY "shorts_delete_own" ON public.shorts
  FOR DELETE USING (creator_id = auth.uid());

-- ============================================================
-- 7. Storage bucket for shorts output
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('shorts-output', 'shorts-output', true);

-- Storage policies: authenticated users can upload, anyone can read
CREATE POLICY "shorts_output_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'shorts-output');

CREATE POLICY "shorts_output_authenticated_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'shorts-output'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "shorts_output_authenticated_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'shorts-output'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "shorts_output_authenticated_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'shorts-output'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- 8. Function to seed a creator row on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.creators (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
