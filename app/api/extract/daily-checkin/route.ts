import { NextRequest, NextResponse } from 'next/server'
import { anthropic, getDailyCheckinPrompt } from '@/lib/anthropic'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { logUsage } from '@/lib/usage-logger'

const MODEL = 'claude-haiku-4-5-20251001'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id
  const { transcript } = (await request.json()) as { transcript: string }
  if (!transcript) return NextResponse.json({ error: 'transcript is required' }, { status: 400 })

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: getDailyCheckinPrompt(),
      messages: [{ role: 'user', content: transcript }],
    })

    const rawText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    const cleanText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    try {
      const extracted = JSON.parse(cleanText)

      await logUsage({
        userId,
        route: '/api/extract/daily-checkin',
        model: MODEL,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        durationMs: Date.now() - startTime,
        status: 'success',
      })

      return NextResponse.json({ extracted, raw_response: rawText })
    } catch {
      console.error('[extract/daily-checkin] JSON parse failed. Raw output:', rawText)
      await logUsage({
        userId,
        route: '/api/extract/daily-checkin',
        model: MODEL,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        durationMs: Date.now() - startTime,
        status: 'error',
        errorMessage: 'JSON parse failed',
      })
      return NextResponse.json({ error: 'Could not parse model output as JSON' }, { status: 500 })
    }
  } catch (err) {
    console.error('[extract/daily-checkin]', err)
    await logUsage({
      userId,
      route: '/api/extract/daily-checkin',
      model: MODEL,
      durationMs: Date.now() - startTime,
      status: 'error',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
