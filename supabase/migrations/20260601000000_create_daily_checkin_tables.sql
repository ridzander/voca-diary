-- daily_checkins FIRST — sleep/mood/nutrition reference it
CREATE TABLE daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  transcript text NOT NULL,
  raw_extraction jsonb,
  daily_notes text,
  ambiguities jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE sleep_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  daily_checkin_id uuid REFERENCES daily_checkins(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  hours numeric,
  quality text CHECK (quality IN ('good', 'okay', 'bad')),
  wake_state text,
  notes text,
  ambiguities jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  daily_checkin_id uuid REFERENCES daily_checkins(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  score int CHECK (score BETWEEN 1 AND 10),
  source text CHECK (source IN ('explicit', 'inferred', 'unknown')) NOT NULL,
  label text CHECK (label IN ('good', 'okay', 'bad')),
  notes text
);

CREATE TABLE nutrition_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  daily_checkin_id uuid REFERENCES daily_checkins(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  meals jsonb DEFAULT '[]'::jsonb,
  drinks jsonb DEFAULT '[]'::jsonb,
  protein_grams numeric,
  notes text,
  ambiguities jsonb DEFAULT '[]'::jsonb
);

-- Link existing tables to daily_checkins (nullable — legacy entries have no checkin_id)
ALTER TABLE symptom_entries ADD COLUMN daily_checkin_id uuid REFERENCES daily_checkins(id) ON DELETE CASCADE;
ALTER TABLE workout_entries ADD COLUMN daily_checkin_id uuid REFERENCES daily_checkins(id) ON DELETE CASCADE;

-- RLS
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own checkins"   ON daily_checkins  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own checkins" ON daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own checkins" ON daily_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own checkins" ON daily_checkins FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see own sleep"    ON sleep_entries  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sleep" ON sleep_entries  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sleep" ON sleep_entries  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sleep" ON sleep_entries  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see own mood"    ON mood_entries  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own mood" ON mood_entries  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own mood" ON mood_entries  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own mood" ON mood_entries  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see own nutrition"    ON nutrition_entries  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own nutrition" ON nutrition_entries  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own nutrition" ON nutrition_entries  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own nutrition" ON nutrition_entries  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX checkins_user_created_idx   ON daily_checkins   (user_id, created_at DESC);
CREATE INDEX sleep_user_created_idx      ON sleep_entries     (user_id, created_at DESC);
CREATE INDEX mood_user_created_idx       ON mood_entries      (user_id, created_at DESC);
CREATE INDEX nutrition_user_created_idx  ON nutrition_entries (user_id, created_at DESC);
