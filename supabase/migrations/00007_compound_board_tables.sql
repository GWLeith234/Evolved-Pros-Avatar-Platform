-- ============================================================
-- Sprint H-0: Compound Board — Database & Seed
-- 4 tables, RLS policies, trigger function, seed data
-- ============================================================

-- 1. habits
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title text NOT NULL,
  pillar_ids text[] NOT NULL DEFAULT '{}',
  xp_value int NOT NULL DEFAULT 10 CHECK (xp_value BETWEEN 5 AND 25),
  leverage_score int NOT NULL DEFAULT 1 CHECK (leverage_score BETWEEN 1 AND 5),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "habits_select" ON habits;
DROP POLICY IF EXISTS "habits_insert" ON habits;
DROP POLICY IF EXISTS "habits_update" ON habits;
DROP POLICY IF EXISTS "habits_delete" ON habits;
CREATE POLICY "habits_select" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "habits_insert" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habits_update" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "habits_delete" ON habits FOR DELETE USING (auth.uid() = user_id);

-- 2. habit_logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  completed_on date NOT NULL DEFAULT CURRENT_DATE,
  xp_earned int NOT NULL DEFAULT 10,
  bonus_xp int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, completed_on)
);
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "habit_logs_select" ON habit_logs;
DROP POLICY IF EXISTS "habit_logs_insert" ON habit_logs;
DROP POLICY IF EXISTS "habit_logs_update" ON habit_logs;
DROP POLICY IF EXISTS "habit_logs_delete" ON habit_logs;
CREATE POLICY "habit_logs_select" ON habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "habit_logs_insert" ON habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habit_logs_update" ON habit_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "habit_logs_delete" ON habit_logs FOR DELETE USING (auth.uid() = user_id);

-- 3. daily_scores
CREATE TABLE IF NOT EXISTS daily_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  score_date date NOT NULL DEFAULT CURRENT_DATE,
  total_xp int NOT NULL DEFAULT 0,
  habits_done int NOT NULL DEFAULT 0,
  habits_total int NOT NULL DEFAULT 0,
  streak_day int NOT NULL DEFAULT 0,
  pillar_xp jsonb NOT NULL DEFAULT '{}',
  UNIQUE (user_id, score_date)
);
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_scores_select" ON daily_scores;
DROP POLICY IF EXISTS "daily_scores_insert" ON daily_scores;
DROP POLICY IF EXISTS "daily_scores_update" ON daily_scores;
CREATE POLICY "daily_scores_select" ON daily_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_scores_insert" ON daily_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_scores_update" ON daily_scores FOR UPDATE USING (auth.uid() = user_id);

-- 4. streak_records
CREATE TABLE IF NOT EXISTS streak_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  streak_start date NOT NULL,
  streak_end date,
  streak_length int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  is_personal_best boolean NOT NULL DEFAULT false
);
ALTER TABLE streak_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "streak_records_select" ON streak_records;
DROP POLICY IF EXISTS "streak_records_insert" ON streak_records;
DROP POLICY IF EXISTS "streak_records_update" ON streak_records;
CREATE POLICY "streak_records_select" ON streak_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "streak_records_insert" ON streak_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "streak_records_update" ON streak_records FOR UPDATE USING (auth.uid() = user_id);

-- 5. calculate_daily_score() trigger function
CREATE OR REPLACE FUNCTION calculate_daily_score()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_date date;
  v_total_xp int;
  v_habits_done int;
  v_habits_total int;
  v_pillar_xp jsonb;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  v_date    := COALESCE(NEW.completed_on, OLD.completed_on);

  SELECT COALESCE(SUM(hl.xp_earned), 0), COUNT(DISTINCT hl.habit_id)
  INTO v_total_xp, v_habits_done
  FROM habit_logs hl
  WHERE hl.user_id = v_user_id AND hl.completed_on = v_date;

  SELECT COUNT(*) INTO v_habits_total
  FROM habits h WHERE h.user_id = v_user_id AND h.is_active = true;

  SELECT jsonb_object_agg(pillar, xp_sum) INTO v_pillar_xp
  FROM (
    SELECT unnest(h.pillar_ids) AS pillar, COALESCE(SUM(hl.xp_earned), 0) AS xp_sum
    FROM habits h
    JOIN habit_logs hl ON hl.habit_id = h.id AND hl.completed_on = v_date
    WHERE h.user_id = v_user_id
    GROUP BY pillar
  ) t;

  INSERT INTO daily_scores (user_id, score_date, total_xp, habits_done, habits_total, pillar_xp)
  VALUES (v_user_id, v_date, v_total_xp, v_habits_done, v_habits_total, COALESCE(v_pillar_xp, '{}'))
  ON CONFLICT (user_id, score_date) DO UPDATE SET
    total_xp = EXCLUDED.total_xp,
    habits_done = EXCLUDED.habits_done,
    habits_total = EXCLUDED.habits_total,
    pillar_xp = EXCLUDED.pillar_xp;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_calculate_daily_score ON habit_logs;
CREATE TRIGGER trg_calculate_daily_score
AFTER INSERT OR DELETE ON habit_logs
FOR EACH ROW EXECUTE FUNCTION calculate_daily_score();

-- 6. Seed habits for George
INSERT INTO habits (user_id, title, pillar_ids, xp_value, leverage_score, sort_order)
SELECT u.id, h.title, h.pillar_ids, h.xp_value, h.leverage_score, h.sort_order
FROM creators u, (VALUES
  ('Morning prayer / meditation', ARRAY['foundation','identity'], 15, 3, 1),
  ('Walk the dog — 30 min',        ARRAY['mental','execution'],    20, 4, 2),
  ('Journal 3 pages',              ARRAY['identity','accountability'], 10, 2, 3),
  ('Review daily WIG',             ARRAY['strategy','accountability'], 15, 3, 4),
  ('Read 20 pages',                ARRAY['mental','strategy'],     12, 3, 5),
  ('End-of-day reflection',        ARRAY['accountability','execution'], 15, 2, 6)
) AS h(title, pillar_ids, xp_value, leverage_score, sort_order)
WHERE u.email = 'geoleith@gmail.com'
ON CONFLICT DO NOTHING;
