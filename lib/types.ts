// ── Symptom types ─────────────────────────────────────────────────────────────

export type SeveritySource = 'explicit' | 'inferred' | 'unknown'

export type FactorCategory =
  | 'sleep'
  | 'food'
  | 'activity'
  | 'work'
  | 'stress'
  | 'medication'
  | 'weather'
  | 'screen_time'
  | 'alcohol'
  | 'social'
  | 'other'

export interface SymptomItem {
  name: string
  location: string | null
  severity: number | null
  severity_source: SeveritySource
  quality: string | null
}

export interface FactorItem {
  name: string
  category: FactorCategory
  time_offset_days: number
  detail: string | null
}

export interface SymptomExtraction {
  symptoms: SymptomItem[]
  factors: FactorItem[]
  mood: string | null
  notes: string | null
  ambiguities: string[]
  raw_transcript: string
}

// ── Workout types ─────────────────────────────────────────────────────────────

export type SessionType = 'lifting' | 'cardio' | 'sport' | 'mixed'
export type ActivityType = 'lifting' | 'cardio' | 'sport'

export interface SetItem {
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  notes: string | null
}

export interface ActivityItem {
  type: ActivityType
  name: string
  sets: SetItem[]
  duration_minutes: number | null
  intensity_notes: string | null
  notes: string | null
}

export interface PostSessionSymptom {
  name: string
  location: string | null
}

export interface WorkoutExtraction {
  session_type: SessionType
  session_label: string
  activities: ActivityItem[]
  session_notes: string | null
  perceived_effort: number | null
  post_session_symptoms: PostSessionSymptom[]
  ambiguities: string[]
  raw_transcript: string
}

// ── DB row types (with server-added fields) ───────────────────────────────────

export interface SymptomEntryRow extends SymptomExtraction {
  id: string
  user_id: string
  created_at: string
  transcript: string
}

export interface WorkoutEntryRow extends WorkoutExtraction {
  id: string
  user_id: string
  created_at: string
  transcript: string
}

// Discriminated union for combined timeline use
export type AnyEntryRow =
  | (SymptomEntryRow & { kind: 'symptom' })
  | (WorkoutEntryRow & { kind: 'workout' })

export const FACTOR_CATEGORIES: FactorCategory[] = [
  'sleep', 'food', 'activity', 'work', 'stress',
  'medication', 'weather', 'screen_time', 'alcohol', 'social', 'other',
]

// ── Live Workout session state ─────────────────────────────────────────────────

export interface LiveSet {
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  notes: string | null
}

export interface LiveActivity {
  id: string           // client-only uuid for keying
  name: string
  sets: LiveSet[]
}

export interface LiveSessionState {
  startedAt: string    // ISO string
  activities: LiveActivity[]
  sessionNotes: string
  perceivedEffort: number | null
}

export const LIVE_SESSION_STORAGE_KEY = 'voca-diary-live-session'

// ── Daily Check-in types ──────────────────────────────────────────────────────

export type MoodSource = 'explicit' | 'inferred' | 'unknown'
export type SleepQuality = 'good' | 'okay' | 'bad'
export type MoodLabel = 'good' | 'okay' | 'bad'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'general'

export interface SleepBlock {
  hours: number | null
  quality: SleepQuality | null
  wake_state: string | null
  ambiguities: string[]
}

export interface MoodBlock {
  score: number | null
  source: MoodSource
  label: MoodLabel | null
  notes: string | null
}

export interface MealItem {
  meal: MealType | null
  items: string[]
}

export interface NutritionBlock {
  meals: MealItem[]
  drinks: string[]
  protein_grams: number | null
  notes: string | null
  ambiguities: string[]
}

export interface SymptomsBlock {
  items: SymptomItem[]
  factors: FactorItem[]
}

export interface WorkoutBlock {
  did_workout: boolean
  skip_reason: string | null
  session_type: SessionType | null
  session_label: string | null
  activities: ActivityItem[]
  session_notes: string | null
  perceived_effort: number | null
}

export interface DailyCheckinExtraction {
  sleep: SleepBlock | null
  mood: MoodBlock | null
  nutrition: NutritionBlock | null
  symptoms: SymptomsBlock | null
  workout: WorkoutBlock | null
  daily_notes: string | null
  ambiguities: string[]
  raw_transcript: string
}

export interface DailyCheckinRow {
  id: string
  user_id: string
  created_at: string
  transcript: string
  raw_extraction: DailyCheckinExtraction | null
  daily_notes: string | null
  ambiguities: string[]
}

// ── Observability ─────────────────────────────────────────────────────────────

export interface UsageRow {
  id: string
  user_id: string | null
  route: string
  model: string | null
  input_tokens: number | null
  output_tokens: number | null
  audio_seconds: number | null
  cost_usd: number | null
  duration_ms: number
  status: 'success' | 'error'
  error_message: string | null
  created_at: string
}
