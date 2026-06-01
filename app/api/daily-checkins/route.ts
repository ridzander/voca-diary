import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { logUsage } from '@/lib/usage-logger'
import type { DailyCheckinExtraction } from '@/lib/types'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id
  const { transcript, data } = (await request.json()) as {
    transcript: string
    data: DailyCheckinExtraction
  }
  if (!transcript || !data) return NextResponse.json({ error: 'transcript and data are required' }, { status: 400 })

  // Step 1 — insert parent daily_checkins row
  const { data: checkin, error: checkinError } = await supabase
    .from('daily_checkins')
    .insert({
      user_id: userId,
      transcript,
      raw_extraction: data,
      daily_notes: data.daily_notes,
      ambiguities: data.ambiguities,
    })
    .select('id')
    .single()

  if (checkinError || !checkin) {
    console.error('[daily-checkins] insert:', checkinError)
    await logUsage({ userId, route: '/api/daily-checkins', durationMs: Date.now() - startTime, status: 'error', errorMessage: checkinError?.message })
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  const checkinId = checkin.id

  const rollback = async () => {
    await supabase.from('daily_checkins').delete().eq('id', checkinId).eq('user_id', userId)
  }

  // Step 2 — sleep
  if (data.sleep) {
    const { error } = await supabase.from('sleep_entries').insert({
      user_id: userId,
      daily_checkin_id: checkinId,
      hours: data.sleep.hours,
      quality: data.sleep.quality,
      wake_state: data.sleep.wake_state,
      ambiguities: data.sleep.ambiguities,
    })
    if (error) {
      console.error('[daily-checkins] sleep insert:', error)
      await rollback()
      await logUsage({ userId, route: '/api/daily-checkins', durationMs: Date.now() - startTime, status: 'error', errorMessage: error.message })
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
  }

  // Step 3 — mood
  if (data.mood) {
    const { error } = await supabase.from('mood_entries').insert({
      user_id: userId,
      daily_checkin_id: checkinId,
      score: data.mood.score,
      source: data.mood.source,
      label: data.mood.label,
      notes: data.mood.notes,
    })
    if (error) {
      console.error('[daily-checkins] mood insert:', error)
      await rollback()
      await logUsage({ userId, route: '/api/daily-checkins', durationMs: Date.now() - startTime, status: 'error', errorMessage: error.message })
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
  }

  // Step 4 — nutrition
  if (data.nutrition) {
    const { error } = await supabase.from('nutrition_entries').insert({
      user_id: userId,
      daily_checkin_id: checkinId,
      meals: data.nutrition.meals,
      drinks: data.nutrition.drinks,
      protein_grams: data.nutrition.protein_grams,
      notes: data.nutrition.notes,
      ambiguities: data.nutrition.ambiguities,
    })
    if (error) {
      console.error('[daily-checkins] nutrition insert:', error)
      await rollback()
      await logUsage({ userId, route: '/api/daily-checkins', durationMs: Date.now() - startTime, status: 'error', errorMessage: error.message })
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
  }

  // Step 5 — symptoms (single row with all items, matching standalone symptom entry shape)
  if (data.symptoms) {
    const { error } = await supabase.from('symptom_entries').insert({
      user_id: userId,
      transcript,
      symptoms: data.symptoms.items,
      factors: data.symptoms.factors,
      mood: null,
      notes: null,
      ambiguities: [],
      daily_checkin_id: checkinId,
    })
    if (error) {
      console.error('[daily-checkins] symptoms insert:', error)
      await rollback()
      await logUsage({ userId, route: '/api/daily-checkins', durationMs: Date.now() - startTime, status: 'error', errorMessage: error.message })
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
  }

  // Step 6 — workout (only if did_workout: true; skips tracked in raw_extraction)
  if (data.workout?.did_workout === true) {
    const { error } = await supabase.from('workout_entries').insert({
      user_id: userId,
      transcript,
      session_type: data.workout.session_type,
      session_label: data.workout.session_label ?? 'Daily check-in workout',
      activities: data.workout.activities,
      session_notes: data.workout.session_notes,
      perceived_effort: data.workout.perceived_effort,
      post_session_symptoms: [],
      ambiguities: [],
      daily_checkin_id: checkinId,
    })
    if (error) {
      console.error('[daily-checkins] workout insert:', error)
      await rollback()
      await logUsage({ userId, route: '/api/daily-checkins', durationMs: Date.now() - startTime, status: 'error', errorMessage: error.message })
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
  }

  await logUsage({ userId, route: '/api/daily-checkins', durationMs: Date.now() - startTime, status: 'success' })
  return NextResponse.json({ id: checkinId, success: true })
}
