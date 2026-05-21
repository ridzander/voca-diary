import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { logUsage } from '@/lib/usage-logger'
import type { SymptomExtraction, WorkoutExtraction } from '@/lib/types'

// ── POST — create new entry ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id

  const body = (await request.json()) as {
    mode: 'symptom' | 'workout'
    data: SymptomExtraction | WorkoutExtraction
    transcript: string
  }
  const { mode, data, transcript } = body
  if (!mode || !data) return NextResponse.json({ error: 'mode and data are required' }, { status: 400 })

  try {
    if (mode === 'symptom') {
      const d = data as SymptomExtraction
      if (!Array.isArray(d.symptoms)) return NextResponse.json({ error: 'Invalid symptom data' }, { status: 400 })
      const { data: entry, error } = await supabase
        .from('symptom_entries')
        .insert({ user_id: userId, transcript, symptoms: d.symptoms, factors: d.factors, mood: d.mood, notes: d.notes, ambiguities: d.ambiguities })
        .select('id').single()
      if (error) {
        console.error('[entries] symptom insert:', error)
        await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'error', errorMessage: error.message })
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
      }
      await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'success' })
      return NextResponse.json({ id: entry.id, success: true })
    }

    if (mode === 'workout') {
      const d = data as WorkoutExtraction
      if (!Array.isArray(d.activities)) return NextResponse.json({ error: 'Invalid workout data' }, { status: 400 })
      const { data: entry, error } = await supabase
        .from('workout_entries')
        .insert({ user_id: userId, transcript, session_type: d.session_type, session_label: d.session_label, activities: d.activities, session_notes: d.session_notes, perceived_effort: d.perceived_effort, post_session_symptoms: d.post_session_symptoms, ambiguities: d.ambiguities })
        .select('id').single()
      if (error) {
        console.error('[entries] workout insert:', error)
        await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'error', errorMessage: error.message })
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
      }
      await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'success' })
      return NextResponse.json({ id: entry.id, success: true })
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  } catch (err) {
    console.error('[entries] POST:', err)
    await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'error', errorMessage: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// ── PATCH — update existing entry ────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const startTime = Date.now()
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id

  const body = (await request.json()) as {
    id: string
    mode: 'symptom' | 'workout'
    data: SymptomExtraction | WorkoutExtraction
    transcript: string
  }
  const { id, mode, data, transcript } = body
  if (!id || !mode || !data) return NextResponse.json({ error: 'id, mode and data are required' }, { status: 400 })

  try {
    if (mode === 'symptom') {
      const d = data as SymptomExtraction
      const { error } = await supabase
        .from('symptom_entries')
        .update({ transcript, symptoms: d.symptoms, factors: d.factors, mood: d.mood, notes: d.notes, ambiguities: d.ambiguities })
        .eq('id', id).eq('user_id', userId)
      if (error) {
        console.error('[entries] symptom update:', error)
        await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'error', errorMessage: error.message })
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
      }
      await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'success' })
      return NextResponse.json({ success: true })
    }

    if (mode === 'workout') {
      const d = data as WorkoutExtraction
      const { error } = await supabase
        .from('workout_entries')
        .update({ transcript, session_type: d.session_type, session_label: d.session_label, activities: d.activities, session_notes: d.session_notes, perceived_effort: d.perceived_effort, post_session_symptoms: d.post_session_symptoms, ambiguities: d.ambiguities })
        .eq('id', id).eq('user_id', userId)
      if (error) {
        console.error('[entries] workout update:', error)
        await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'error', errorMessage: error.message })
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
      }
      await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'success' })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  } catch (err) {
    console.error('[entries] PATCH:', err)
    await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'error', errorMessage: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// ── DELETE — remove entry ─────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const startTime = Date.now()
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id

  try {
    const { id, mode } = (await request.json()) as { id: string; mode: 'symptom' | 'workout' }
    if (!id || !mode) return NextResponse.json({ error: 'id and mode are required' }, { status: 400 })

    const table = mode === 'symptom' ? 'symptom_entries' : 'workout_entries'
    const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', userId)
    if (error) {
      console.error('[entries] delete:', error)
      await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'error', errorMessage: error.message })
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
    await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'success' })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[entries] DELETE:', err)
    await logUsage({ userId, route: '/api/entries', durationMs: Date.now() - startTime, status: 'error', errorMessage: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
