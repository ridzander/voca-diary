import { NextRequest, NextResponse } from 'next/server'
import { anthropic, getSymptomPrompt, getWorkoutPrompt } from '@/lib/anthropic'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as { mode: 'symptom' | 'workout'; transcript: string }
  const { mode, transcript } = body

  if (!mode || !transcript) {
    return NextResponse.json({ error: 'mode and transcript are required' }, { status: 400 })
  }

  const systemPrompt = mode === 'symptom' ? getSymptomPrompt() : getWorkoutPrompt()

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: transcript }],
    })

    const rawText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('')

    // Strip accidental markdown code fences
    const cleanText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    try {
      const extracted = JSON.parse(cleanText)
      return NextResponse.json({ extracted, raw_response: rawText })
    } catch {
      console.error('[extract] JSON parse failed. Raw output:', rawText)
      return NextResponse.json(
        { error: 'Could not parse model output as JSON', raw_response: rawText },
        { status: 500 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed'
    console.error('[extract]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
