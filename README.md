# Voca Diary

Voca Diary is a voice-first journal for tracking symptoms and workouts. Tap a button, speak naturally, and the app transcribes your audio, extracts structured data with Claude, and saves everything to Supabase so you can spot patterns over time.

**Status:** Day 5 of 14 — voice flow, quick log (symptom and set), and live workout mode.

---

## What works today

- **Auth**: email + password sign up / sign in, protected routes via middleware, sign out
- **Recording**: tap the mic, record audio, Whisper transcription (or mock mode during dev)
- **AI extraction**: transcript → Claude Haiku → structured JSON (symptoms or workout)
- **Review card**: editable form pre-filled with Claude's output — edit any field before saving
  - Symptom card: symptoms (name, location, severity slider, quality), factors, mood, notes
  - Workout card: activities with sets table (reps/weight/RPE), session notes, effort slider, post-session symptoms
- **Save**: entries stored in Supabase with RLS (each user sees only their own)
- **Symptom timeline**: severity chart + expand/collapse cards + delete + edit
- **Workout timeline**: exercise progression chart (weight over time) + expand/collapse + delete + edit
- **Quick Log**: 3-tap entry without voice — body area pills + severity slider (symptoms) or exercise picker + weight/reps auto-fill from history (sets)
- **Live Workout mode**: set-by-set gym logging with a running timer, session notes, perceived effort slider, auto-fills from last session, resumable after app close (4-hour window)
- **FAB**: floating `+` button on all pages opens Quick Log sheet

---

## What's next: Day 6

Dogfooding day and bug-bash from real usage.

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Fill in environment variables

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API → service_role key |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys |

Set `MOCK_TRANSCRIPTION=true` to skip Whisper during development (returns a realistic sample transcript).

### 3. Run the database migration

Supabase dashboard → SQL Editor → paste `supabase/migrations/001_initial_schema.sql` → Run.

Creates `symptom_entries` and `workout_entries` tables with RLS policies.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

---

## Project structure

```
app/
  page.tsx                     ← Home server component (fetches recent entries)
  HomeClient.tsx               ← Home client component (sheets + FAB state)
  login/page.tsx               ← Email/password sign in
  signup/page.tsx              ← Email/password sign up
  record/[mode]/page.tsx       ← Recording → transcription → extraction → review
  workout/live/page.tsx        ← Live workout mode (set-by-set logging with timer)
  timeline/symptoms/           ← Symptom timeline with severity chart
  timeline/workouts/           ← Workout timeline with progression chart
  entries/symptom/[id]/edit/   ← Edit symptom entry
  entries/workout/[id]/edit/   ← Edit workout entry
  api/transcribe/route.ts      ← POST audio → Whisper → transcript
  api/extract/route.ts         ← POST transcript → Claude Haiku → structured JSON
  api/entries/route.ts         ← POST/PATCH/DELETE entries in Supabase
  api/exercise-history/route.ts← GET exercise names and last set for auto-fill
  layout.tsx / globals.css
components/
  SymptomReviewCard.tsx        ← Editable review form for symptom entries
  WorkoutReviewCard.tsx        ← Editable review form for workout entries
  QuickLogSheet.tsx            ← Bottom sheet: choose Quick symptom or Quick set
  QuickSymptomSheet.tsx        ← Body area pills + severity slider, no voice needed
  QuickSetSheet.tsx            ← Exercise picker + weight/reps, auto-fills from history
  LogWorkoutSheet.tsx          ← Choose: Voice log or Live workout mode
  FAB.tsx                      ← Fixed floating action button (opens Quick Log)
  SignOutButton.tsx             ← Client component for sign out
  ui/                          ← Button, Card, Input, Textarea, Label, Badge, Sonner,
                                  BottomSheet, AlertDialog
lib/
  types.ts                     ← All types: extractions, DB rows, live session state
  anthropic.ts                 ← Anthropic client + getSymptomPrompt/getWorkoutPrompt
  openai.ts                    ← OpenAI client
  supabase-browser.ts          ← createSupabaseBrowserClient() for client components
  supabase-server.ts           ← createSupabaseServerClient() + service role client
  date-utils.ts                ← groupByDay, dayLabel, timeLabel, shortDate
  workout-history.ts           ← getLastSetForExercise, getUserLiftingExercises
prompts/
  symptom-extractor.md         ← Claude system prompt (finalized Day 1, do not modify)
  workout-extractor.md         ← Claude system prompt (finalized Day 1, do not modify)
middleware.ts                  ← Auth guard — redirects unauthenticated users to /login
instrumentation.ts             ← Logs first 200 chars of each prompt on server startup
supabase/migrations/
  001_initial_schema.sql       ← Tables + RLS (run manually in Supabase dashboard)
```
