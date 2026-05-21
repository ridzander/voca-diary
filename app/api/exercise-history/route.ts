import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getLastSetForExercise, getUserLiftingExercises } from '@/lib/workout-history'
import { logUsage } from '@/lib/usage-logger'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id
  const { searchParams } = request.nextUrl
  const name = searchParams.get('name')

  try {
    // ?name=... → return last set for that exercise
    if (name) {
      const last = await getLastSetForExercise(userId, name)
      await logUsage({ userId, route: '/api/exercise-history', durationMs: Date.now() - startTime, status: 'success' })
      return NextResponse.json({ last })
    }

    // No name → return all exercise names sorted by recency
    const exercises = await getUserLiftingExercises(userId)
    await logUsage({ userId, route: '/api/exercise-history', durationMs: Date.now() - startTime, status: 'success' })
    return NextResponse.json({ exercises })
  } catch (err) {
    console.error('[exercise-history]', err)
    await logUsage({ userId, route: '/api/exercise-history', durationMs: Date.now() - startTime, status: 'error', errorMessage: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
