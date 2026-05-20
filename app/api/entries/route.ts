import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { SymptomExtraction, WorkoutExtraction } from '@/lib/types'

// ── POST — create new entry ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as {
    mode: 'symptom' | 'workout'
    data: SymptomExtraction | WorkoutExtraction
    transcript: string
  }
  const { mode, data, transcript } = body
  if (!mode || !data) return NextResponse.json({ error: 'mode and data are required' }, { status: 400 })

  if (mode === 'symptom') {
    const d = data as SymptomExtraction
    if (!Array.isArray(d.symptoms)) return NextResponse.json({ error: 'Invalid symptom data' }, { status: 400 })
    const { data: entry, error } = await supabase
      .from('symptom_entries')
      .insert({ user_id: user.id, transcript, symptoms: d.symptoms, factors: d.factors, mood: d.mood, notes: d.notes, ambiguities: d.ambiguities })
      .select('id').single()
    if (error) { console.error('[entries] symptom insert:', error); return NextResponse.json({ error: error.message }, { status: 500 }) }
    return NextResponse.json({ id: entry.id, success: true })
  }

  if (mode === 'workout') {
    const d = data as WorkoutExtraction
    if (!Array.isArray(d.activities)) return NextResponse.json({ error: 'Invalid workout data' }, { status: 400 })
    const { data: entry, error } = await supabase
      .from('workout_entries')
      .insert({ user_id: user.id, transcript, session_type: d.session_type, session_label: d.session_label, activities: d.activities, session_notes: d.session_notes, perceived_effort: d.perceived_effort, post_session_symptoms: d.post_session_symptoms, ambiguities: d.ambiguities })
      .select('id').single()
    if (error) { console.error('[entries] workout insert:', error); return NextResponse.json({ error: error.message }, { status: 500 }) }
    return NextResponse.json({ id: entry.id, success: true })
  }

  return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
}

// ── PATCH — update existing entry ────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as {
    id: string
    mode: 'symptom' | 'workout'
    data: SymptomExtraction | WorkoutExtraction
    transcript: string
  }
  const { id, mode, data, transcript } = body
  if (!id || !mode || !data) return NextResponse.json({ error: 'id, mode and data are required' }, { status: 400 })

  if (mode === 'symptom') {
    const d = data as SymptomExtraction
    const { error } = await supabase
      .from('symptom_entries')
      .update({ transcript, symptoms: d.symptoms, factors: d.factors, mood: d.mood, notes: d.notes, ambiguities: d.ambiguities })
      .eq('id', id).eq('user_id', user.id)
    if (error) { console.error('[entries] symptom update:', error); return NextResponse.json({ error: error.message }, { status: 500 }) }
    return NextResponse.json({ success: true })
  }

  if (mode === 'workout') {
    const d = data as WorkoutExtraction
    const { error } = await supabase
      .from('workout_entries')
      .update({ transcript, session_type: d.session_type, session_label: d.session_label, activities: d.activities, session_notes: d.session_notes, perceived_effort: d.perceived_effort, post_session_symptoms: d.post_session_symptoms, ambiguities: d.ambiguities })
      .eq('id', id).eq('user_id', user.id)
    if (error) { console.error('[entries] workout update:', error); return NextResponse.json({ error: error.message }, { status: 500 }) }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
}

// ── DELETE — remove entry ─────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, mode } = (await request.json()) as { id: string; mode: 'symptom' | 'workout' }
  if (!id || !mode) return NextResponse.json({ error: 'id and mode are required' }, { status: 400 })

  const table = mode === 'symptom' ? 'symptom_entries' : 'workout_entries'
  const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id)
  if (error) { console.error('[entries] delete:', error); return NextResponse.json({ error: error.message }, { status: 500 }) }
  return NextResponse.json({ success: true })
}
