import { createSupabaseServiceRoleClient } from '@/lib/supabase-server'
import type { WorkoutEntryRow } from '@/lib/types'

export async function getLastSetForExercise(
  userId: string,
  exerciseName: string
): Promise<{ weight_kg: number | null; reps: number | null } | null> {
  const supabase = createSupabaseServiceRoleClient()
  const { data } = await supabase
    .from('workout_entries')
    .select('activities, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data) return null

  for (const row of data as Pick<WorkoutEntryRow, 'activities' | 'created_at'>[]) {
    for (const activity of row.activities) {
      if (
        activity.type === 'lifting' &&
        activity.name.toLowerCase() === exerciseName.toLowerCase() &&
        activity.sets.length > 0
      ) {
        const last = activity.sets[activity.sets.length - 1]
        return { weight_kg: last.weight_kg, reps: last.reps }
      }
    }
  }
  return null
}

// Returns all distinct lifting exercise names for a user, sorted by most-recently-used
export async function getUserLiftingExercises(userId: string): Promise<string[]> {
  const supabase = createSupabaseServiceRoleClient()
  const { data } = await supabase
    .from('workout_entries')
    .select('activities, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (!data) return []

  const seen = new Set<string>()
  const ordered: string[] = []

  for (const row of data as Pick<WorkoutEntryRow, 'activities' | 'created_at'>[]) {
    for (const activity of row.activities) {
      if (activity.type === 'lifting' && activity.name && !seen.has(activity.name)) {
        seen.add(activity.name)
        ordered.push(activity.name)
      }
    }
  }
  return ordered
}
