import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { SymptomEntryRow, WorkoutEntryRow } from '@/lib/types'
import { HomeClient } from './HomeClient'

async function getHomeData() {
  const supabase = createSupabaseServerClient()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: symptoms },
    { data: workouts },
    { data: weekSymptoms },
    { data: weekWorkouts },
    { data: { user } },
  ] = await Promise.all([
    supabase.from('symptom_entries').select('id, created_at, symptoms').order('created_at', { ascending: false }).limit(3),
    supabase.from('workout_entries').select('id, created_at, session_label, activities').order('created_at', { ascending: false }).limit(3),
    supabase.from('symptom_entries').select('symptoms').gte('created_at', weekAgo),
    supabase.from('workout_entries').select('id').gte('created_at', weekAgo),
    supabase.auth.getUser(),
  ])

  type AnyEntry = { id: string; created_at: string; kind: 'symptom' | 'workout'; label: string }

  const symptomRows: AnyEntry[] = (symptoms ?? []).map((s: Partial<SymptomEntryRow>) => {
    const first = Array.isArray(s.symptoms) && s.symptoms.length > 0 ? s.symptoms[0] : null
    const sev = first?.severity != null ? ` · severity ${first.severity}` : ''
    return { id: s.id!, created_at: s.created_at!, kind: 'symptom', label: `${first?.name ?? 'symptom entry'}${sev}` }
  })

  const workoutRows: AnyEntry[] = (workouts ?? []).map((w: Partial<WorkoutEntryRow>) => {
    const count = Array.isArray(w.activities) ? w.activities.length : 0
    return { id: w.id!, created_at: w.created_at!, kind: 'workout', label: `${w.session_label ?? 'workout'} · ${count} exercise${count !== 1 ? 's' : ''}` }
  })

  const recentEntries = [...symptomRows, ...workoutRows]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  // Week stats for hero card
  const severities = (weekSymptoms ?? []).flatMap((s: Partial<SymptomEntryRow>) =>
    (s.symptoms ?? []).map((sym) => sym.severity).filter((v): v is number => v !== null)
  )
  const avgSeverity = severities.length > 0
    ? Math.round((severities.reduce((a, b) => a + b, 0) / severities.length) * 10) / 10
    : null

  return {
    entries: recentEntries,
    weekWorkouts: (weekWorkouts ?? []).length,
    avgSeverityThisWeek: avgSeverity,
    hasSymptomData: severities.length > 0,
    userEmail: user?.email ?? null,
  }
}

type RecentEntry = Awaited<ReturnType<typeof getHomeData>>['entries'][0]

export default async function Home() {
  const data = await getHomeData()
  return <HomeClient {...data} />
}

export type { RecentEntry }
