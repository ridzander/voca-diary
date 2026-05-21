import { NextRequest, NextResponse } from 'next/server'
import { anthropic, getSymptomPrompt, getWorkoutPrompt } from '@/lib/anthropic'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { logUsage } from '@/lib/usage-logger'

const MODEL = 'claude-haiku-4-5-20251001'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id

  const body = (await request.json()) as { mode: 'symptom' | 'workout'; transcript: string }
  const { mode, transcript } = body

  if (!mode || !transcript) {
    return NextResponse.json({ error: 'mode and transcript are required' }, { status: 400 })
  }

  const systemPrompt = mode === 'symptom' ? getSymptomPrompt() : getWorkoutPrompt()

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
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

      await logUsage({
        userId,
        route: '/api/extract',
        model: MODEL,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        durationMs: Date.now() - startTime,
        status: 'success',
      })

      return NextResponse.json({ extracted, raw_response: rawText })
    } catch {
      console.error('[extract] JSON parse failed. Raw output:', rawText)

      await logUsage({
        userId,
        route: '/api/extract',
        model: MODEL,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        durationMs: Date.now() - startTime,
        status: 'error',
        errorMessage: 'JSON parse failed',
      })

      return NextResponse.json(
        { error: 'Something went wrong' },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('[extract]', err)
    await logUsage({
      userId,
      route: '/api/extract',
      model: MODEL,
      durationMs: Date.now() - startTime,
      status: 'error',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
