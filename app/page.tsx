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
    { data: profile },
    { data: checkins },
  ] = await Promise.all([
    supabase.from('symptom_entries').select('id, created_at, symptoms').order('created_at', { ascending: false }).limit(3),
    supabase.from('workout_entries').select('id, created_at, session_label, activities').order('created_at', { ascending: false }).limit(3),
    supabase.from('symptom_entries').select('symptoms').gte('created_at', weekAgo),
    supabase.from('workout_entries').select('id').gte('created_at', weekAgo),
    supabase.auth.getUser(),
    supabase.from('profiles').select('first_name').maybeSingle(),
    supabase.from('daily_checkins').select('id, created_at, raw_extraction').order('created_at', { ascending: false }).limit(3),
  ])

  type AnyEntry = { id: string; created_at: string; kind: 'symptom' | 'workout' | 'checkin'; label: string }

  const symptomRows: AnyEntry[] = (symptoms ?? []).map((s: Partial<SymptomEntryRow>) => {
    const first = Array.isArray(s.symptoms) && s.symptoms.length > 0 ? s.symptoms[0] : null
    const sev = first?.severity != null ? ` · severity ${first.severity}` : ''
    return { id: s.id!, created_at: s.created_at!, kind: 'symptom', label: `${first?.name ?? 'symptom entry'}${sev}` }
  })

  const workoutRows: AnyEntry[] = (workouts ?? []).map((w: Partial<WorkoutEntryRow>) => {
    const count = Array.isArray(w.activities) ? w.activities.length : 0
    return { id: w.id!, created_at: w.created_at!, kind: 'workout', label: `${w.session_label ?? 'workout'} · ${count} exercise${count !== 1 ? 's' : ''}` }
  })

  const checkinRows: AnyEntry[] = (checkins ?? []).map((c: { id: string; created_at: string; raw_extraction: Record<string, unknown> | null }) => {
    const rx = c.raw_extraction
    const populated = ['sleep', 'mood', 'nutrition', 'symptoms', 'workout']
      .filter((k) => rx?.[k] != null)
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
    const label = populated.length > 0 ? populated.join(' · ') : 'Daily check-in'
    return { id: c.id, created_at: c.created_at, kind: 'checkin', label }
  })

  const recentEntries = [...symptomRows, ...workoutRows, ...checkinRows]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

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
    firstName: (profile as { first_name?: string | null } | null)?.first_name ?? null,
    userEmail: user?.email ?? null,
  }
}

type RecentEntry = Awaited<ReturnType<typeof getHomeData>>['entries'][0]

export default async function Home() {
  const data = await getHomeData()
  return <HomeClient {...data} />
}

export type { RecentEntry }
