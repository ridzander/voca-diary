import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getLastSetForExercise, getUserLiftingExercises } from '@/lib/workout-history'

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const name = searchParams.get('name')

  // ?name=... → return last set for that exercise
  if (name) {
    const last = await getLastSetForExercise(user.id, name)
    return NextResponse.json({ last })
  }

  // No name → return all exercise names sorted by recency
  const exercises = await getUserLiftingExercises(user.id)
  return NextResponse.json({ exercises })
}
