-- Voca Diary — initial schema
-- Run this in the Supabase dashboard → SQL Editor

create extension if not exists "uuid-ossp";

-- ── Symptom entries ──────────────────────────────────────────────────────────

create table if not exists symptom_entries (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  transcript   text,
  symptoms     jsonb,
  factors      jsonb,
  mood         text,
  notes        text,
  ambiguities  jsonb
);

alter table symptom_entries enable row level security;

create policy "Users can select their own symptom entries"
  on symptom_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own symptom entries"
  on symptom_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own symptom entries"
  on symptom_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own symptom entries"
  on symptom_entries for delete
  using (auth.uid() = user_id);

-- ── Workout entries ───────────────────────────────────────────────────────────

create table if not exists workout_entries (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  created_at            timestamptz not null default now(),
  transcript            text,
  session_type          text,
  session_label         text,
  activities            jsonb,
  session_notes         text,
  perceived_effort      int,
  post_session_symptoms jsonb,
  ambiguities           jsonb
);

alter table workout_entries enable row level security;

create policy "Users can select their own workout entries"
  on workout_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workout entries"
  on workout_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workout entries"
  on workout_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own workout entries"
  on workout_entries for delete
  using (auth.uid() = user_id);
