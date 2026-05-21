CREATE TABLE api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  route text NOT NULL,
  model text,
  input_tokens int,
  output_tokens int,
  audio_seconds numeric,
  cost_usd numeric,
  duration_ms int NOT NULL,
  status text NOT NULL CHECK (status IN ('success','error')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX api_usage_user_created_idx ON api_usage (user_id, created_at DESC);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

-- No INSERT policy for users — only the server (via service role) writes to this table.
